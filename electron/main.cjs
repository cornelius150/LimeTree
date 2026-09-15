const { app, BrowserWindow, ipcMain, dialog, session, Menu, clipboard, shell } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let db = null
let docPath = null       // 当前 .md 文档路径
let needSave = false
let nodeClip = null      // 节点剪贴板 { action:'copy'|'cut', rows:[...] }

/* ================= sql.js helpers ================= */
function dbRun(sql, params) {
  if (params && params.length > 0) {
    const stmt = db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free()
  } else db.run(sql)
  needSave = true
}
function dbGet(sql, params) {
  const stmt = db.prepare(sql); if (params) stmt.bind(params)
  let row = null; if (stmt.step()) row = stmt.getAsObject(); stmt.free(); return row
}
function dbAll(sql, params) {
  const results = []; const stmt = db.prepare(sql); if (params) stmt.bind(params)
  while (stmt.step()) results.push(stmt.getAsObject()); stmt.free(); return results
}
function dbLastId() { return db.exec('SELECT last_insert_rowid()')[0].values[0][0] }

/* ================= Markdown Document Storage ================= */
/* LimeTree 文档即 .md 文件：
   <!-- lt:node {"id":1,"parent":0,...} -->  作为节点头标记，正文为 Markdown */
function serializeDoc() {
  const lines = []
  lines.push('<!-- LimeTree Document -->')
  const bms = dbAll('SELECT node_id FROM bookmarks ORDER BY seq, node_id')
  lines.push('<!-- lt:bookmarks ' + JSON.stringify(bms.map(b => b.node_id)) + ' -->')
  lines.push('')
  const walk = (n) => {
    const meta = { id: n.id, parent: n.parent_id || 0, name: n.name || '', icon: n.icon || '', color: n.color || '', created: n.created_at || '', updated: n.updated_at || '', expanded: n.is_expanded ? 1 : 0 }
    lines.push('<!-- lt:node ' + JSON.stringify(meta) + ' -->')
    lines.push(typeof n.content === 'string' ? n.content : '')
    lines.push('')
    for (const c of dbAll('SELECT * FROM nodes WHERE parent_id=? ORDER BY sort_order, id', [n.id])) walk(c)
  }
  for (const r of dbAll('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY sort_order, id')) walk(r)
  return lines.join('\n')
}

function saveDocFile() {
  if (!db || !docPath || !needSave) return
  try { fs.writeFileSync(docPath, serializeDoc(), 'utf-8'); needSave = false } catch (e) { console.error('Save error:', e) }
}

function parseAndLoadMD(text) {
  db.run('DELETE FROM bookmarks'); db.run('DELETE FROM nodes')
  const re = /<!--\s*lt:node\s+(\{.*?\})\s*-->\r?\n?/g
  const marks = []
  let m
  while ((m = re.exec(text))) marks.push({ meta: JSON.parse(m[1]), contentStart: m.index + m[0].length })
  let maxId = 0; const order = {}
  for (let i = 0; i < marks.length; i++) {
    const cur = marks[i], next = marks[i + 1]
    const content = text.slice(cur.contentStart, next ? next.start : text.length).trimEnd()
    const { id, parent, name, icon, color, created, updated, expanded } = cur.meta
    const pid = parent ? parent : null
    order[pid || 0] = (order[pid || 0] === undefined ? -1 : order[pid || 0]) + 1
    dbRun('INSERT INTO nodes (id,parent_id,name,icon,color,content,created_at,updated_at,is_expanded,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, pid, name || '节点', icon || '', color || '', content, created || '', updated || '', expanded ? 1 : 0, order[pid || 0]])
    if (id > maxId) maxId = id
  }
  const bm = text.match(/<!--\s*lt:bookmarks\s+(\[[^\]]*\])\s*-->/)
  if (bm) { try { JSON.parse(bm[1]).forEach((nid, i) => dbRun('INSERT INTO bookmarks (node_id, seq) VALUES (?,?)', [nid, i])) } catch {} }
  try { db.run("DELETE FROM sqlite_sequence WHERE name IN ('nodes','bookmarks')") } catch {}
  if (maxId > 0) db.run("INSERT INTO sqlite_sequence (name, seq) VALUES ('nodes', " + maxId + ")")
  needSave = false
}

/* ================= Database Init ================= */
async function initDB() {
  const initSqlJs = require('sql.js')
  const sqlMain = require.resolve('sql.js')
  const wasm = fs.readFileSync(path.join(path.dirname(sqlMain), 'sql-wasm.wasm'))
  const SQL = await initSqlJs({ wasm })
  db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  db.run(`CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    name TEXT DEFAULT 'New Node',
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    sort_order INTEGER DEFAULT 0,
    is_expanded INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS bookmarks (node_id INTEGER PRIMARY KEY, seq INTEGER DEFAULT 0)`)

  const newInstance = process.argv.includes('--new-instance')
  docPath = newInstance
    ? path.join(app.getPath('userData'), 'limetree-' + Date.now() + '.md')
    : path.join(app.getPath('userData'), 'limetree.md')

  if (fs.existsSync(docPath)) {
    parseAndLoadMD(fs.readFileSync(docPath, 'utf-8'))
  }
  const cnt = dbGet('SELECT COUNT(*) as c FROM nodes')
  if (!cnt || cnt.c === 0) {
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    dbRun("INSERT INTO nodes (parent_id,name,icon,color,content,created_at) VALUES (NULL,'我的笔记本','📔','','# 我的笔记本\n\n> 创建时间: ' || ?)", [now])
    const rid = dbLastId()
    dbRun("INSERT INTO nodes (parent_id,name,icon,color,content,created_at) VALUES (?, '欢迎使用 LimeTree','📄','', '# 欢迎使用 LimeTree\n\n## 与 CherryTree 一致的菜单\n\n- 文件 / 编辑 / 搜索 / 视图 / 导入导出 / 书签 / 格式 / 树 / 帮助\n- 插入时间戳 Ctrl+;\n- 待办事项列表\n- 小/中/大/特大号字\n\n## 特色\n\n- 图片/表格/代码框可鼠标拖拽缩放\n- 节点显示创建时间戳\n- 笔记保存为 .md 文件\n\n> 创建时间: ' || ?)", [rid, now])
    needSave = true; saveDocFile()
  }
  setInterval(saveDocFile, 5000)
}

/* ================= IPC: Tree ================= */
ipcMain.handle('db:get-tree', () => dbAll('SELECT * FROM nodes ORDER BY sort_order, id'))
ipcMain.handle('db:get-node', (e, id) => dbGet('SELECT * FROM nodes WHERE id=?', [id]))

ipcMain.handle('db:create-node', (e, { parentId, name, icon }) => {
  let so = 0
  const p = parentId ? [parentId] : null
  const m = parentId
    ? dbGet('SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id=?', p)
    : dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL")
  so = m.m + 1
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  dbRun('INSERT INTO nodes (parent_id,name,icon,content,created_at) VALUES (?,?,?,?,?)', [parentId || null, name || '新建节点', icon || '📄', '', now])
  const nid = dbLastId()
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDocFile()
  return { id: nid }
})

ipcMain.handle('db:update-node', (e, { id, fields }) => {
  const sets = [], vals = []
  for (const [k, v] of Object.entries(fields)) { sets.push(k + '=?'); vals.push(v) }
  sets.push("updated_at=datetime('now','localtime')")
  vals.push(id)
  dbRun('UPDATE nodes SET ' + sets.join(', ') + ' WHERE id=?', vals)
  saveDocFile()
  return { success: true }
})

function delRecursive(id) {
  for (const c of dbAll('SELECT id FROM nodes WHERE parent_id=?', [id])) delRecursive(c.id)
  dbRun('DELETE FROM bookmarks WHERE node_id=?', [id])
  dbRun('DELETE FROM nodes WHERE id=?', [id])
}
ipcMain.handle('db:delete-node', (e, id) => { delRecursive(id); saveDocFile(); return { success: true } })

ipcMain.handle('db:move-node', (e, { id, parentId, sortOrder }) => {
  if (id === parentId) return { success: false }
  let p = parentId
  while (p) { if (p === id) return { success: false }; const r = dbGet('SELECT parent_id FROM nodes WHERE id=?', [p]); p = r ? r.parent_id : null }
  dbRun("UPDATE nodes SET parent_id=?,sort_order=?,updated_at=datetime('now','localtime') WHERE id=?", [parentId, sortOrder, id])
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDocFile(); return { success: true }
})

/* 节点上移/下移（同级相邻交换） */
function reorderSiblings(parentId) {
  const kids = dbAll('SELECT id FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [parentId])
  kids.forEach((k, i) => dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [i, k.id]))
}
ipcMain.handle('db:node-up', (e, id) => {
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return { success: false }
  const sibs = dbAll('SELECT id FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [n.parent_id])
  const i = sibs.findIndex(s => s.id === id)
  if (i <= 0) return { success: false }
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [sibs[i - 1].sort_order, id])
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [n.sort_order, sibs[i - 1].id])
  saveDocFile(); return { success: true }
})
ipcMain.handle('db:node-down', (e, id) => {
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return { success: false }
  const sibs = dbAll('SELECT id FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [n.parent_id])
  const i = sibs.findIndex(s => s.id === id)
  if (i === -1 || i >= sibs.length - 1) return { success: false }
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [sibs[i + 1].sort_order, id])
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [n.sort_order, sibs[i + 1].id])
  saveDocFile(); return { success: true }
})

/* 复制子树快照（rows 保存相对层级：root 的 parent 记 0） */
function snapshotSubtree(rootId) {
  const rows = []
  const walk = (pid, relParent) => {
    dbAll('SELECT * FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [pid]).forEach((n, i) => {
      rows.push({ relParent, name: n.name, icon: n.icon, color: n.color, content: n.content, order: i, created: n.created_at, expanded: n.is_expanded })
      walk(n.id, n.id)
    })
  }
  const root = dbGet('SELECT * FROM nodes WHERE id=?', [rootId])
  if (!root) return null
  rows.push({ relParent: 0, name: root.name, icon: root.icon, color: root.color, content: root.content, order: 0, created: root.created_at, expanded: root.is_expanded, originId: rootId })
  walk(rootId, rootId)
  return rows
}
function restoreSubtree(rows, targetParentId, atEnd = true, afterId = null) {
  const idMap = {}
  const root = rows[0]
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  let so = 0
  if (atEnd) {
    const m = targetParentId
      ? dbGet('SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id=?', [targetParentId])
      : dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL")
    so = m.m + 1
  } else if (afterId) {
    const a = dbGet('SELECT parent_id, sort_order FROM nodes WHERE id=?', [afterId])
    dbRun('UPDATE nodes SET sort_order=sort_order+1 WHERE parent_id IS ? AND sort_order>?', [a.parent_id, a.sort_order])
    so = a.sort_order + 1
    targetParentId = a.parent_id
  }
  dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,is_expanded,sort_order) VALUES (?,?,?,?,?,?,?,?)',
    [targetParentId, root.name, root.icon, root.color, root.content, now, root.expanded ? 1 : 0, so])
  const newRoot = dbLastId()
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const mappedParent = idMap[r.relParent] || newRoot
    dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,is_expanded,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [mappedParent, r.name, r.icon, r.color, r.content, now, r.expanded ? 1 : 0, r.order])
    idMap[r.relParent] = dbLastId()
  }
  if (targetParentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [targetParentId])
  saveDocFile()
  return newRoot
}
ipcMain.handle('db:copy-node', (e, id) => { nodeClip = { action: 'copy', rows: snapshotSubtree(id) }; return { success: !!nodeClip.rows } })
ipcMain.handle('db:cut-node', (e, id) => { nodeClip = { action: 'cut', rows: snapshotSubtree(id) }; return { success: !!nodeClip.rows } })
ipcMain.handle('db:paste-node', (e, { targetId }) => {
  if (!nodeClip || !nodeClip.rows) return { success: false, reason: '剪贴板为空' }
  const newId = restoreSubtree(nodeClip.rows, targetId || null, true)
  if (nodeClip.action === 'cut') { delRecursive(nodeClip.rows[0].originId); nodeClip = null }
  saveDocFile()
  return { success: true, id: newId }
})
ipcMain.handle('db:duplicate-node', (e, id) => {
  const rows = snapshotSubtree(id); if (!rows) return { success: false }
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id])
  const newId = restoreSubtree(rows, n.parent_id, false, id)
  return { success: true, id: newId }
})

/* 排序 */
ipcMain.handle('db:sort-children', (e, id) => {
  const kids = dbAll('SELECT id, name FROM nodes WHERE parent_id=?', [id]).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
  kids.forEach((k, i) => dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [i, k.id]))
  saveDocFile(); return { success: true }
})
ipcMain.handle('db:sort-tree', () => {
  const sortRec = (pid) => {
    const kids = dbAll('SELECT id, name FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [pid])
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
    kids.forEach((k, i) => { dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [i, k.id]); sortRec(k.id) })
  }
  sortRec(null); saveDocFile(); return { success: true }
})

ipcMain.handle('db:change-id', (e, { id, newId }) => {
  if (!newId || newId === id) return { success: false, reason: '无效 ID' }
  if (dbGet('SELECT id FROM nodes WHERE id=?', [newId])) return { success: false, reason: 'ID 已被占用' }
  db.run('PRAGMA foreign_keys = OFF')
  dbRun('UPDATE nodes SET id=? WHERE id=?', [newId, id])
  dbRun('UPDATE nodes SET parent_id=? WHERE parent_id=?', [newId, id])
  dbRun('UPDATE bookmarks SET node_id=? WHERE node_id=?', [newId, id])
  db.run('PRAGMA foreign_keys = ON')
  saveDocFile(); return { success: true }
})

ipcMain.handle('db:expand-all', () => { dbRun('UPDATE nodes SET is_expanded=1'); saveDocFile(); return { success: true } })
ipcMain.handle('db:collapse-all', () => { dbRun('UPDATE nodes SET is_expanded=0'); saveDocFile(); return { success: true } })

ipcMain.handle('db:node-info', (e, id) => {
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return null
  const kids = dbGet('SELECT COUNT(*) as c FROM nodes WHERE parent_id=?', [id]).c
  const content = typeof n.content === 'string' ? n.content : ''
  return { id: n.id, name: n.name, icon: n.icon, created: n.created_at, updated: n.updated_at, chars: content.length, words: (content.match(/\S+/g) || []).length, children: kids }
})

/* ================= IPC: Bookmarks ================= */
ipcMain.handle('bm:add', (e, id) => {
  if (!dbGet('SELECT id FROM nodes WHERE id=?', [id])) return { success: false }
  if (dbGet('SELECT node_id FROM bookmarks WHERE node_id=?', [id])) return { success: true }
  const m = dbGet('SELECT COALESCE(MAX(seq),-1) as m FROM bookmarks')
  dbRun('INSERT INTO bookmarks (node_id, seq) VALUES (?,?)', [id, m.m + 1])
  saveDocFile(); return { success: true }
})
ipcMain.handle('bm:remove', (e, id) => { dbRun('DELETE FROM bookmarks WHERE node_id=?', [id]); saveDocFile(); return { success: true } })
ipcMain.handle('bm:list', () => {
  const out = []
  for (const b of dbAll('SELECT b.node_id as id, b.seq FROM bookmarks b ORDER BY b.seq, b.node_id')) {
    const n = dbGet('SELECT id,name,icon FROM nodes WHERE id=?', [b.id])
    if (n) out.push({ id: b.id, name: n.name, icon: n.icon })
  }
  return out
})
ipcMain.handle('bm:move', (e, { id, dir }) => {
  const cur = dbGet('SELECT * FROM bookmarks WHERE node_id=?', [id]); if (!cur) return { success: false }
  const all = dbAll('SELECT node_id, seq FROM bookmarks ORDER BY seq, node_id')
  const i = all.findIndex(x => x.node_id === id)
  const j = dir < 0 ? i - 1 : i + 1
  if (j < 0 || j >= all.length) return { success: false }
  dbRun('UPDATE bookmarks SET seq=? WHERE node_id=?', [all[j].seq, id])
  dbRun('UPDATE bookmarks SET seq=? WHERE node_id=?', [cur.seq, all[j].node_id])
  saveDocFile(); return { success: true }
})

/* ================= IPC: Document ================= */
ipcMain.handle('doc:open', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '打开笔记', filters: [{ name: 'Markdown 文档', extensions: ['md'] }, { name: '所有文件', extensions: ['*'] }], properties: ['openFile'] })
  if (r.canceled || !r.filePaths.length) return null
  docPath = r.filePaths[0]
  parseAndLoadMD(fs.readFileSync(docPath, 'utf-8'))
  mainWindow.webContents.send('doc:reloaded')
  return { path: docPath }
})
ipcMain.handle('doc:save', () => { needSave = true; saveDocFile(); return { path: docPath, saved: !needSave } })
ipcMain.handle('doc:save-as', async () => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '另存为', defaultPath: docPath || 'limetree.md', filters: [{ name: 'Markdown 文档', extensions: ['md'] }] })
  if (r.canceled || !r.filePath) return null
  docPath = r.filePath
  needSave = true; saveDocFile()
  return { path: docPath }
})
ipcMain.handle('doc:new-instance', () => { app.relaunch({ args: process.argv.slice(1).concat(['--new-instance']) }); app.exit(0) })
ipcMain.handle('doc:get-path', () => docPath)

/* ================= IPC: Import / Export ================= */
function nextRootOrder() { return dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL").m + 1 }
function stripHTML(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
  t = t.replace(/<[^>]+>/g, '')
  const ents = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }
  return t.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (s) => ents[s]).replace(/\n{3,}/g, '\n\n').trim()
}
ipcMain.handle('imp:txt', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '从 TXT 文件导入', filters: [{ name: '文本文件', extensions: ['txt', 'md'] }], properties: ['openFile'] })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  dbRun('INSERT INTO nodes (parent_id,name,icon,content,created_at,sort_order) VALUES (NULL,?,?,?,?,' + nextRootOrder() + ')',
    [path.basename(fp, path.extname(fp)), '📄', fs.readFileSync(fp, 'utf-8'), now])
  saveDocFile(); mainWindow.webContents.send('doc:reloaded')
  return { id: dbLastId() }
})
ipcMain.handle('imp:txt-folder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '从 TXT 文件夹导入', properties: ['openDirectory'] })
  if (r.canceled || !r.filePaths.length) return null
  let count = 0; const now = new Date().toLocaleString('zh-CN', { hour12: false })
  for (const f of fs.readdirSync(r.filePaths[0])) {
    if (!/\.(txt|md)$/i.test(f)) continue
    dbRun('INSERT INTO nodes (parent_id,name,icon,content,created_at,sort_order) VALUES (NULL,?,?,?,?,' + nextRootOrder() + ')',
      [f.replace(/\.(txt|md)$/i, ''), '📄', fs.readFileSync(path.join(r.filePaths[0], f), 'utf-8'), now])
    count++
  }
  saveDocFile(); mainWindow.webContents.send('doc:reloaded')
  return { count }
})
ipcMain.handle('imp:html', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '从 HTML 文件导入', filters: [{ name: 'HTML 文件', extensions: ['html', 'htm'] }], properties: ['openFile'] })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  dbRun('INSERT INTO nodes (parent_id,name,icon,content,created_at,sort_order) VALUES (NULL,?,?,?,?,' + nextRootOrder() + ')',
    [path.basename(fp, path.extname(fp)), '🌐', stripHTML(fs.readFileSync(fp, 'utf-8')), now])
  saveDocFile(); mainWindow.webContents.send('doc:reloaded')
  return { id: dbLastId() }
})
ipcMain.handle('imp:unsupported', async (e, fmt) => {
  dialog.showMessageBox(mainWindow, { type: 'info', title: '导入', message: '暂不支持从 ' + fmt + ' 导入', detail: 'LimeTree 当前支持：TXT 文件、TXT 文件夹、HTML 文件、Markdown(.md) 文件导入。' })
})

ipcMain.handle('exp:txt', async (e, { node }) => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '导出为纯文本', defaultPath: (node.name || 'limetree') + '.txt', filters: [{ name: '纯文本', extensions: ['txt'] }] })
  if (r.canceled || !r.filePath) return null
  const md = typeof node.content === 'string' ? node.content : ''
  fs.writeFileSync(r.filePath, md, 'utf-8')
  return { path: r.filePath }
})
ipcMain.handle('exp:html', async (e, { node }) => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '导出为 HTML', defaultPath: (node.name || 'limetree') + '.html', filters: [{ name: 'HTML', extensions: ['html'] }] })
  if (r.canceled || !r.filePath) return null
  let MarkdownIt
  try { MarkdownIt = require('markdown-it') } catch { MarkdownIt = null }
  let body
  if (MarkdownIt) { try { body = new MarkdownIt({ html: false, breaks: true }).render(typeof node.content === 'string' ? node.content : '') } catch { body = '<pre>' + (node.content || '') + '</pre>' } }
  else body = '<pre>' + (node.content || '') + '</pre>'
  fs.writeFileSync(r.filePath, `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${node.name || ''}</title><style>body{font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7}pre{background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto}code{background:#f0f0f0;padding:1px 4px;border-radius:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f7fa}img{max-width:100%}blockquote{border-left:3px solid #4a90d9;padding-left:12px;color:#666}</style></head><body><h1>${node.icon || ''} ${node.name || ''}</h1><p style="color:#999;font-size:12px">创建时间: ${node.created_at || ''}</p>${body}</body></html>`, 'utf-8')
  return { path: r.filePath }
})
ipcMain.handle('exp:pdf', async (e, { node }) => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '导出为 PDF', defaultPath: (node.name || 'limetree') + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] })
  if (r.canceled || !r.filePath) return null
  let MarkdownIt; try { MarkdownIt = require('markdown-it') } catch { MarkdownIt = null }
  let body
  if (MarkdownIt) { try { body = new MarkdownIt({ html: false, breaks: true }).render(typeof node.content === 'string' ? node.content : '') } catch { body = '<pre>' + (node.content || '') + '</pre>' } }
  else body = '<pre>' + (node.content || '') + '</pre>'
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${node.name || ''}</title><style>body{font-family:"Microsoft YaHei",SimSun,sans-serif;max-width:700px;margin:30px auto;line-height:1.8;font-size:12pt}pre{background:#f6f8fa;padding:10px;border-radius:4px;white-space:pre-wrap;font-size:10pt}code{background:#f0f0f0;padding:1px 3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:5px;font-size:10pt}th{background:#f5f7fa}img{max-width:100%}blockquote{border-left:3px solid #4a90d9;padding-left:10px;color:#555}h1{font-size:18pt}h2{font-size:15pt}h3{font-size:13pt}</style></head><body><h1>${node.icon || ''} ${node.name || ''}</h1><p style="color:#888;font-size:9pt">创建时间: ${node.created_at || ''}</p>${body}</body></html>`
  const win = new BrowserWindow({ show: false, webPreferences: {} })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  const pdf = await win.webContents.printToPDF({ printBackground: true, margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } })
  win.destroy()
  fs.writeFileSync(r.filePath, pdf)
  return { path: r.filePath }
})
ipcMain.handle('doc:print', () => { mainWindow.webContents.print({ silent: false, printBackground: true }); return { ok: true } })

/* ================= IPC: 全部节点替换 ================= */
ipcMain.handle('replace:all', (e, { find, replace }) => {
  if (!find) return { count: 0 }
  let count = 0
  for (const n of dbAll('SELECT id, content FROM nodes')) {
    const txt = typeof n.content === 'string' ? n.content : ''
    if (txt.includes(find)) {
      count += txt.split(find).length - 1
      dbRun('UPDATE nodes SET content=REPLACE(content,?,?) WHERE id=?', [find, replace, n.id])
    }
  }
  saveDocFile(); return { count }
})

/* ================= IPC: Search ================= */
ipcMain.handle('db:search', (e, kw) => {
  if (!kw || !kw.trim()) return []
  const k = kw.trim().toLowerCase()
  const results = []
  for (const n of dbAll('SELECT id,parent_id,name,icon,content FROM nodes ORDER BY sort_order,id')) {
    const nm = n.name && n.name.toLowerCase().includes(k)
    let cm = false, snip = ''
    const txt = typeof n.content === 'string' ? n.content : ''
    if (txt && txt.toLowerCase().includes(k)) { cm = true; const i = txt.toLowerCase().indexOf(k); snip = (i > 30 ? '...' : '') + txt.substring(Math.max(0, i - 30), i + k.length + 30) + (i + k.length + 30 < txt.length ? '...' : '') }
    if (nm || cm) results.push({ id: n.id, parent_id: n.parent_id, name: n.name, icon: n.icon, snippet: cm ? snip : '名称匹配' })
  }
  return results
})

/* ================= IPC: Dialogs & Clipboard ================= */
ipcMain.handle('dialog:select-image', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '选择图片', filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] }], properties: ['openFile'] })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  const buf = fs.readFileSync(fp)
  const ext = path.extname(fp).slice(1).toLowerCase()
  const mime = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', bmp: 'bmp', webp: 'webp', svg: 'svg' }[ext] || 'png'
  return { dataUrl: 'data:image/' + mime + ';base64,' + buf.toString('base64'), name: path.basename(fp) }
})
ipcMain.handle('clipboard:read-text', () => clipboard.readText())
ipcMain.handle('clipboard:write-text', (e, t) => clipboard.writeText(t))

/* ================= Menu (与 CherryTree 一致) ================= */
function M(label, accel, ch, extra) {
  const it = { label, click: () => mainWindow.webContents.send(ch) }
  if (accel) it.accelerator = accel
  return Object.assign(it, extra || {})
}
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    /* ---------- 文件 ---------- */
    { label: '文件(F)', submenu: [
      M('新建笔记实例...', 'Ctrl+Alt+N', 'menu:new-instance'),
      M('打开笔记...', 'Ctrl+O', 'menu:open'),
      M('保存笔记', 'Ctrl+S', 'menu:save'),
      M('另存为笔记...', 'Ctrl+Shift+S', 'menu:save-as'),
      { type: 'separator' },
      M('打印...', 'Ctrl+P', 'menu:print'),
      { type: 'separator' },
      { label: '退出', accelerator: 'Ctrl+Q', click: () => app.quit() }
    ]},
    /* ---------- 编辑 ---------- */
    { label: '编辑(E)', submenu: [
      M('撤销', 'Ctrl+Z', 'menu:undo'),
      M('重做', 'Ctrl+Y', 'menu:redo'),
      { type: 'separator' },
      M('剪切', 'Ctrl+X', 'menu:cut'),
      M('复制', 'Ctrl+C', 'menu:copy'),
      M('粘贴', 'Ctrl+V', 'menu:paste'),
      M('粘贴为富文本', null, 'menu:paste-rich'),
      { type: 'separator' },
      M('重复行', 'Ctrl+D', 'menu:dup-line'),
      M('删除行', 'Ctrl+K', 'menu:del-line'),
      M('上移行', 'Ctrl+Up', 'menu:line-up'),
      M('下移行', 'Ctrl+Down', 'menu:line-down'),
      { type: 'separator' },
      M('剪切节点', 'Ctrl+Shift+X', 'menu:cut-node'),
      M('复制节点', 'Ctrl+Shift+C', 'menu:copy-node'),
      M('粘贴节点', 'Ctrl+Shift+V', 'menu:paste-node'),
      { type: 'separator' },
      M('格式化表格...', null, 'menu:format-table')
    ]},
    /* ---------- 搜索 ---------- */
    { label: '搜索(S)', submenu: [
      M('在节点中查找...', 'Ctrl+F', 'menu:find'),
      M('在所有节点中查找...', 'Ctrl+Shift+F', 'menu:find-all'),
      M('在节点中查找下一个', 'F3', 'menu:find-next'),
      M('在节点中查找上一个', 'Shift+F3', 'menu:find-prev'),
      { type: 'separator' },
      M('在选中文本中查找...', 'Ctrl+Alt+F', 'menu:find-selected'),
      M('在所有节点的选中文本中查找...', 'Ctrl+Alt+A', 'menu:find-selected-all'),
      { type: 'separator' },
      M('替换节点中的内容...', 'Ctrl+H', 'menu:replace'),
      M('替换所有节点中的内容...', 'Ctrl+Shift+H', 'menu:replace-all'),
      { type: 'separator' },
      M('迭代器：按名称查找节点', 'Ctrl+Shift+L', 'menu:iter-find'),
      M('迭代器：查找下一个节点', null, 'menu:iter-next'),
      { type: 'separator' },
      M('搜索一个文件夹...', null, 'menu:search-folder')
    ]},
    /* ---------- 视图 ---------- */
    { label: '视图(V)', submenu: [
      M('显示工具栏', null, 'menu:view-toolbar', { type: 'checkbox', checked: true }),
      M('显示树状视图', null, 'menu:view-tree', { type: 'checkbox', checked: true }),
      M('显示行号', null, 'menu:view-ln', { type: 'checkbox', checked: false }),
      M('显示空白字符', null, 'menu:view-ws', { type: 'checkbox', checked: false }),
      M('显示行结尾字符', null, 'menu:view-le', { type: 'checkbox', checked: false }),
      { type: 'separator' },
      M('自动换行', 'Ctrl+L', 'menu:view-wrap', { type: 'checkbox', checked: true }),
      { type: 'separator' },
      M('折叠全部节点', 'Ctrl+Alt+C', 'menu:collapse-all'),
      M('展开全部节点', 'Ctrl+Alt+E', 'menu:expand-all'),
      { type: 'separator' },
      M('增大字体', 'Ctrl+=', 'menu:zoom-in'),
      M('减小字体', 'Ctrl+-', 'menu:zoom-out'),
      M('重置字体大小', 'Ctrl+0', 'menu:zoom-reset')
    ]},
    /* ---------- 导入/导出 ---------- */
    { label: '导入/导出(D)', submenu: [
      M('从 HTML 文件导入节点...', null, 'menu:imp-html'),
      M('从 TXT 文件导入节点...', null, 'menu:imp-txt'),
      M('从 TXT 文件夹导入节点...', null, 'menu:imp-txt-folder'),
      { type: 'separator' },
      M('从 CherryTree 文档导入...', null, 'menu:imp-ct'),
      M('从 Gnote 文件夹导入...', null, 'menu:imp-gnote'),
      M('从 KeepNote 文件夹导入...', null, 'menu:imp-keepnote'),
      M('从 KeyNote 文件导入...', null, 'menu:imp-keynote'),
      M('从 Knowit 文件导入...', null, 'menu:imp-knowit'),
      M('从 Leo 文件导入...', null, 'menu:imp-leo'),
      M('从 Mempad 文件导入...', null, 'menu:imp-mempad'),
      M('从 NoteCase 文件导入...', null, 'menu:imp-notecase'),
      M('从 RedNotebook 文件夹导入...', null, 'menu:imp-rednotebook'),
      M('从 Tomboy 文件夹导入...', null, 'menu:imp-tomboy'),
      M('从 TreePad 文件导入...', null, 'menu:imp-treepad'),
      M('从 TuxCards 文件导入...', null, 'menu:imp-tuxcards'),
      M('从 Zim 文件夹导入...', null, 'menu:imp-zim'),
      { type: 'separator' },
      M('导出为 PDF...', null, 'menu:exp-pdf'),
      M('导出为纯文本...', null, 'menu:exp-txt'),
      M('导出为 HTML...', null, 'menu:exp-html')
    ]},
    /* ---------- 书签 ---------- */
    { label: '书签(B)', submenu: [
      M('添加节点到书签', 'Ctrl+Shift+B', 'menu:bm-add'),
      M('从书签中删除节点', null, 'menu:bm-remove'),
      { type: 'separator' },
      M('处理书签...', null, 'menu:bm-handle')
    ]},
    /* ---------- 格式 ---------- */
    { label: '格式(O)', submenu: [
      M('文本颜色...', 'Ctrl+Shift+T', 'menu:text-color'),
      M('文本背景色...', 'Ctrl+Shift+H', 'menu:bg-color'),
      { type: 'separator' },
      M('加粗', 'Ctrl+B', 'menu:bold'),
      M('斜体', 'Ctrl+I', 'menu:italic'),
      M('下划线', 'Ctrl+U', 'menu:underline'),
      M('删除线', 'Ctrl+K', 'menu:strike'),
      { type: 'separator' },
      M('小号字', 'Ctrl+1', 'menu:small'),
      M('中号字', 'Ctrl+2', 'menu:normal'),
      M('大号字', 'Ctrl+3', 'menu:large'),
      M('特大号字', 'Ctrl+4', 'menu:huge'),
      { type: 'separator' },
      M('编号列表', 'Ctrl+Alt+1', 'menu:n-list'),
      M('项目符号列表', 'Ctrl+Alt+2', 'menu:b-list'),
      M('待办事项列表', 'Ctrl+Alt+3', 'menu:todo-list'),
      { type: 'separator' },
      M('降级列表项', 'Ctrl+Alt+-', 'menu:list-dec'),
      M('升级列表项', 'Ctrl+Alt+=', 'menu:list-inc'),
      { type: 'separator' },
      M('粘贴为纯文本', 'Ctrl+Alt+P', 'menu:paste-plain'),
      M('插入时间戳', 'Ctrl+;', 'menu:timestamp'),
      { type: 'separator' },
      M('删除格式', 'Ctrl+Shift+R', 'menu:remove-format')
    ]},
    /* ---------- 树 ---------- */
    { label: '树(T)', submenu: [
      M('添加节点', 'Ctrl+N', 'menu:add-node'),
      M('添加子节点', 'Ctrl+J', 'menu:add-child'),
      M('重复节点', null, 'menu:dup-node'),
      { type: 'separator' },
      M('更改节点 ID...', null, 'menu:change-id'),
      M('排序节点...', null, 'menu:sort-children'),
      M('排序树...', null, 'menu:sort-tree'),
      { type: 'separator' },
      M('上移节点', 'Ctrl+PageUp', 'menu:node-up'),
      M('下移节点', 'Ctrl+PageDown', 'menu:node-down'),
      { type: 'separator' },
      M('重命名节点', 'F2', 'menu:rename-node'),
      M('更改节点图标...', null, 'menu:node-icon'),
      M('更改高亮颜色...', null, 'menu:node-color'),
      { type: 'separator' },
      M('继承语法', null, 'menu:inherit-syntax'),
      { type: 'separator' },
      M('节点信息...', null, 'menu:node-info'),
      { type: 'separator' },
      M('删除节点', null, 'menu:delete-node')
    ]},
    /* ---------- 帮助 ---------- */
    { label: '帮助(H)', submenu: [
      M('检查更新', null, 'menu:check-update'),
      { type: 'separator' },
      M('帮助', 'F1', 'menu:help'),
      M('关于 LimeTree', null, 'menu:about')
    ]}
  ]))
}

/* ================= Window ================= */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: 'LimeTree',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  })
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'v' && (input.control || input.meta) && !input.shift) {
      const img = clipboard.readImage()
      if (!img.isEmpty()) {
        event.preventDefault()
        const b64 = img.toPNG().toString('base64')
        mainWindow.webContents.executeJavaScript(`window.__ltPasteImg && window.__ltPasteImg('data:image/png;base64,${b64}')`)
      }
    }
  })
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'clipboard-read' || perm === 'clipboard-sanitized-write'))
  await initDB()
  createWindow()
  buildMenu()
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow() })
})
app.on('before-quit', () => { needSave = true; saveDocFile() })
app.on('window-all-closed', () => { needSave = true; saveDocFile(); if (process.platform !== 'darwin') app.quit() })
