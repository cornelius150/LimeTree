const { app, BrowserWindow, ipcMain, dialog, session, Menu, clipboard, shell } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let db = null
let docPath = null
let needSave = false
let nodeClip = null

/* ========== sql.js helpers ========== */
function dbRun(sql, params) {
  try {
    if (params && params.length > 0) { const stmt = db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free() }
    else db.run(sql)
    needSave = true
  } catch (e) { console.error('dbRun error:', e.message, sql) }
}
function dbGet(sql, params) {
  try { const stmt = db.prepare(sql); if (params) stmt.bind(params); let row = null; if (stmt.step()) row = stmt.getAsObject(); stmt.free(); return row }
  catch (e) { console.error('dbGet error:', e.message, sql); return null }
}
function dbAll(sql, params) {
  try { const results = []; const stmt = db.prepare(sql); if (params) stmt.bind(params); while (stmt.step()) results.push(stmt.getAsObject()); stmt.free(); return results }
  catch (e) { console.error('dbAll error:', e.message, sql); return [] }
}
function dbLastId() { try { return db.exec('SELECT last_insert_rowid()')[0].values[0][0] } catch { return 0 } }

/* ========== Markdown Document Storage ========== */
function serializeDoc() {
  const lines = ['<!-- LimeTree Document -->']
  const bms = dbAll('SELECT node_id FROM bookmarks ORDER BY seq, node_id')
  lines.push('<!-- lt:bookmarks ' + JSON.stringify(bms.map(b => b.node_id)) + ' -->')
  lines.push('')
  function walk(n) {
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
  const marks = []; let m
  while ((m = re.exec(text))) marks.push({ meta: JSON.parse(m[1]), contentStart: m.index + m[0].length })
  let maxId = 0; const order = {}
  for (let i = 0; i < marks.length; i++) {
    const cur = marks[i], next = marks[i + 1]
    const content = text.slice(cur.contentStart, next ? next.index : text.length).trimEnd()
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

/* ========== Database Init ========== */
async function initDB() {
  const initSqlJs = require('sql.js')
  const sqlMain = require.resolve('sql.js')
  const wasm = fs.readFileSync(path.join(path.dirname(sqlMain), 'sql-wasm.wasm'))
  const SQL = await initSqlJs({ wasm })
  db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  db.run(`CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, name TEXT DEFAULT 'New Node',
    icon TEXT DEFAULT '', color TEXT DEFAULT '', content TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')),
    sort_order INTEGER DEFAULT 0, is_expanded INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE)`)
  db.run(`CREATE TABLE IF NOT EXISTS bookmarks (node_id INTEGER PRIMARY KEY, seq INTEGER DEFAULT 0)`)
  const newInstance = process.argv.includes('--new-instance')
  docPath = newInstance ? path.join(app.getPath('userData'), 'limetree-' + Date.now() + '.md') : path.join(app.getPath('userData'), 'limetree.md')
  if (fs.existsSync(docPath)) {
    try { parseAndLoadMD(fs.readFileSync(docPath, 'utf-8')) }
    catch (err) { console.error('Parse failed, starting fresh:', err.message); try { fs.renameSync(docPath, docPath + '.bak.' + Date.now()) } catch {}; db.run('DELETE FROM nodes'); db.run('DELETE FROM bookmarks') }
  }
  const cnt = dbGet('SELECT COUNT(*) as c FROM nodes')
  if (!cnt || cnt.c === 0) {
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    dbRun("INSERT INTO nodes (parent_id,name,icon,color,content,created_at) VALUES (NULL,?,?,?,?,?)", ['我的笔记本', '📔', '', '# 我的笔记本\n\n> 创建时间: ' + now, now])
    const rid = dbLastId()
    dbRun("INSERT INTO nodes (parent_id,name,icon,color,content,created_at) VALUES (?,?,?,?,?,?)", [rid, '欢迎使用 LimeTree', '📄', '', '# 欢迎使用 LimeTree\n\n基于 CherryTree 源码菜单结构\n图片/表格/代码框可拖拽缩放\nMarkdown 格式存储\n\n> 创建时间: ' + now, now])
    needSave = true; saveDocFile()
  }
  setInterval(saveDocFile, 5000)
}

/* ========== IPC: Tree ========== */
ipcMain.handle('db:get-tree', () => dbAll('SELECT * FROM nodes ORDER BY sort_order, id'))
ipcMain.handle('db:get-node', (e, id) => dbGet('SELECT * FROM nodes WHERE id=?', [id]))
ipcMain.handle('db:create-node', (e, { parentId, name, icon }) => {
  let so = 0
  const m = parentId ? dbGet('SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id=?', [parentId]) : dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL")
  so = (m && m.m !== undefined) ? m.m + 1 : 0
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at) VALUES (?,?,?,?,?,?,?)', [parentId || null, name || '新建节点', icon || '📄', '', '', now, now])
  const nid = dbLastId()
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDocFile(); return { id: nid }
})
ipcMain.handle('db:update-node', (e, { id, fields }) => {
  const sets = [], vals = []
  for (const [k, v] of Object.entries(fields)) { sets.push(k + '=?'); vals.push(v) }
  sets.push("updated_at=datetime('now','localtime')"); vals.push(id)
  dbRun('UPDATE nodes SET ' + sets.join(', ') + ' WHERE id=?', vals); saveDocFile(); return { success: true }
})
function delRecursive(id) { for (const c of dbAll('SELECT id FROM nodes WHERE parent_id=?', [id])) delRecursive(c.id); dbRun('DELETE FROM bookmarks WHERE node_id=?', [id]); dbRun('DELETE FROM nodes WHERE id=?', [id]) }
ipcMain.handle('db:delete-node', (e, id) => { delRecursive(id); saveDocFile(); return { success: true } })
ipcMain.handle('db:move-node', (e, { id, parentId, sortOrder }) => {
  if (id === parentId) return { success: false }
  let p = parentId; while (p) { if (p === id) return { success: false }; const r = dbGet('SELECT parent_id FROM nodes WHERE id=?', [p]); p = r ? r.parent_id : null }
  dbRun("UPDATE nodes SET parent_id=?,sort_order=?,updated_at=datetime('now','localtime') WHERE id=?", [parentId, sortOrder, id])
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDocFile(); return { success: true }
})
ipcMain.handle('db:node-up', (e, id) => {
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return { success: false }
  const sibs = dbAll('SELECT id,sort_order FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [n.parent_id])
  const i = sibs.findIndex(s => s.id === id)
  if (i <= 0) return { success: false }
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [sibs[i-1].sort_order, id])
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [n.sort_order, sibs[i-1].id])
  saveDocFile(); return { success: true }
})
ipcMain.handle('db:node-down', (e, id) => {
  const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return { success: false }
  const sibs = dbAll('SELECT id,sort_order FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [n.parent_id])
  const i = sibs.findIndex(s => s.id === id)
  if (i === -1 || i >= sibs.length - 1) return { success: false }
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [sibs[i+1].sort_order, id])
  dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [n.sort_order, sibs[i+1].id])
  saveDocFile(); return { success: true }
})
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
  rows.push({ relParent: 0, name: root.name, icon: root.icon, color: root.color, content: root.content, order: 0, created: root.created_at, expanded: root.is_expanded, originId: root.id })
  walk(rootId, root.id)
  return rows
}
function restoreSubtree(rows, targetParentId, atEnd = true) {
  const idMap = {}; const root = rows[0]; const now = new Date().toLocaleString('zh-CN', { hour12: false })
  let so = 0
  if (atEnd) { const m = targetParentId ? dbGet('SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id=?', [targetParentId]) : dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL"); so = (m && m.m !== undefined) ? m.m + 1 : 0 }
  dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,is_expanded,sort_order) VALUES (?,?,?,?,?,?,?,?)', [targetParentId, root.name, root.icon, root.color, root.content, now, root.expanded ? 1 : 0, so])
  const newRoot = dbLastId()
  for (let i = 1; i < rows.length; i++) { const r = rows[i]; const mappedParent = idMap[r.relParent] || newRoot; dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,is_expanded,sort_order) VALUES (?,?,?,?,?,?,?,?)', [mappedParent, r.name, r.icon, r.color, r.content, now, r.expanded ? 1 : 0, r.order]); idMap[r.relParent] = dbLastId() }
  if (targetParentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [targetParentId])
  saveDocFile(); return newRoot
}
ipcMain.handle('db:copy-node', (e, id) => { nodeClip = { action: 'copy', rows: snapshotSubtree(id) }; return { success: !!nodeClip.rows } })
ipcMain.handle('db:cut-node', (e, id) => { nodeClip = { action: 'cut', rows: snapshotSubtree(id) }; return { success: !!nodeClip.rows } })
ipcMain.handle('db:paste-node', (e, { targetId }) => {
  if (!nodeClip || !nodeClip.rows) return { success: false }
  const newId = restoreSubtree(nodeClip.rows, targetId || null)
  if (nodeClip.action === 'cut') { delRecursive(nodeClip.rows[0].originId); nodeClip = null }
  saveDocFile(); return { success: true, id: newId }
})
ipcMain.handle('db:duplicate-node', (e, id) => { const rows = snapshotSubtree(id); if (!rows) return { success: false }; const n = dbGet('SELECT parent_id FROM nodes WHERE id=?', [id]); const newId = restoreSubtree(rows, n ? n.parent_id : null, false); return { success: true, id: newId } })
ipcMain.handle('db:sort-children', (e, id) => { const kids = dbAll('SELECT id, name FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [id]).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN')); kids.forEach((k, i) => dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [i, k.id])); saveDocFile(); return { success: true } })
ipcMain.handle('db:sort-tree', () => { function sortRec(pid) { const kids = dbAll('SELECT id, name FROM nodes WHERE parent_id IS ? ORDER BY sort_order, id', [pid]).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN')); kids.forEach((k, i) => { dbRun('UPDATE nodes SET sort_order=? WHERE id=?', [i, k.id]); sortRec(k.id); }); } sortRec(null); saveDocFile(); return { success: true } })
ipcMain.handle('db:expand-all', () => { dbRun('UPDATE nodes SET is_expanded=1'); saveDocFile(); return { success: true } })
ipcMain.handle('db:collapse-all', () => { dbRun('UPDATE nodes SET is_expanded=0'); saveDocFile(); return { success: true } })
ipcMain.handle('db:node-info', (e, id) => { const n = dbGet('SELECT * FROM nodes WHERE id=?', [id]); if (!n) return null; const kids = dbGet('SELECT COUNT(*) as c FROM nodes WHERE parent_id=?', [id]); const content = typeof n.content === 'string' ? n.content : ''; return { id: n.id, name: n.name, icon: n.icon, created: n.created_at, updated: n.updated_at, chars: content.length, words: (content.match(/\S+/g) || []).length, children: kids ? kids.c : 0 } })

/* ========== IPC: Search ========== */
ipcMain.handle('db:search', (e, kw) => {
  if (!kw || !kw.trim()) return []
  const k = kw.trim().toLowerCase(); const results = []
  for (const n of dbAll('SELECT id,parent_id,name,icon,content FROM nodes ORDER BY sort_order,id')) {
    const nm = n.name && n.name.toLowerCase().includes(k); let cm = false, snip = ''
    const txt = typeof n.content === 'string' ? n.content : ''
    if (txt && txt.toLowerCase().includes(k)) { cm = true; const i = txt.toLowerCase().indexOf(k); snip = (i > 30 ? '...' : '') + txt.substring(Math.max(0, i - 30), i + k.length + 30) + (i + k.length + 30 < txt.length ? '...' : '') }
    if (nm || cm) results.push({ id: n.id, parent_id: n.parent_id, name: n.name, icon: n.icon, snippet: cm ? snip : '名称匹配' })
  }
  return results
})

/* ========== IPC: Bookmarks ========== */
ipcMain.handle('bm:add', (e, id) => { if (!dbGet('SELECT id FROM nodes WHERE id=?', [id])) return { success: false }; if (dbGet('SELECT node_id FROM bookmarks WHERE node_id=?', [id])) return { success: true }; const m = dbGet('SELECT COALESCE(MAX(seq),-1) as m FROM bookmarks'); dbRun('INSERT INTO bookmarks (node_id, seq) VALUES (?,?)', [id, m.m + 1]); saveDocFile(); return { success: true } })
ipcMain.handle('bm:remove', (e, id) => { dbRun('DELETE FROM bookmarks WHERE node_id=?', [id]); saveDocFile(); return { success: true } })
ipcMain.handle('bm:list', () => { const out = []; for (const b of dbAll('SELECT b.node_id as id, b.seq FROM bookmarks b ORDER BY b.seq, b.node_id')) { const n = dbGet('SELECT id,name,icon FROM nodes WHERE id=?', [b.id]); if (n) out.push({ id: b.id, name: n.name, icon: n.icon }) } return out })

/* ========== IPC: Document ========== */
ipcMain.handle('doc:open', async () => { const r = await dialog.showOpenDialog(mainWindow, { title: '打开笔记', filters: [{ name: 'Markdown', extensions: ['md'] }, { name: '所有文件', extensions: ['*'] }], properties: ['openFile'] }); if (r.canceled || !r.filePaths.length) return null; docPath = r.filePaths[0]; try { parseAndLoadMD(fs.readFileSync(docPath, 'utf-8')) } catch (e) { console.error(e) }; mainWindow.webContents.send('doc:reloaded'); return { path: docPath } })
ipcMain.handle('doc:save', () => { needSave = true; saveDocFile(); return { path: docPath, saved: !needSave } })
ipcMain.handle('doc:save-as', async () => { const r = await dialog.showSaveDialog(mainWindow, { title: '另存为', defaultPath: docPath || 'limetree.md', filters: [{ name: 'Markdown', extensions: ['md'] }] }); if (r.canceled || !r.filePath) return null; docPath = r.filePath; needSave = true; saveDocFile(); return { path: docPath } })
ipcMain.handle('doc:new-instance', () => { app.relaunch({ args: process.argv.slice(1).concat(['--new-instance']) }); app.exit(0) })
ipcMain.handle('doc:get-path', () => docPath)

/* ========== IPC: Import / Export ========== */
function nextRootOrder() { const m = dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL"); return (m && m.m !== undefined) ? m.m + 1 : 0 }
function stripHTML(html) { let t = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, ''); t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n'); t = t.replace(/<[^>]+>/g, ''); const ents = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }; return t.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, s => ents[s]).replace(/\n{3,}/g, '\n\n').trim() }
ipcMain.handle('imp:txt', async () => { const r = await dialog.showOpenDialog(mainWindow, { title: '从 TXT 文件导入', filters: [{ name: '文本文件', extensions: ['txt', 'md'] }], properties: ['openFile'] }); if (r.canceled || !r.filePaths.length) return null; const fp = r.filePaths[0]; const now = new Date().toLocaleString('zh-CN', { hour12: false }); dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,sort_order) VALUES (NULL,?,?,?,?,?,' + nextRootOrder() + ')', [path.basename(fp, path.extname(fp)), '📄', '', fs.readFileSync(fp, 'utf-8'), now]); saveDocFile(); mainWindow.webContents.send('doc:reloaded'); return { id: dbLastId() } })
ipcMain.handle('imp:txt-folder', async () => { const r = await dialog.showOpenDialog(mainWindow, { title: '从 TXT 文件夹导入', properties: ['openDirectory'] }); if (r.canceled || !r.filePaths.length) return null; let count = 0; const now = new Date().toLocaleString('zh-CN', { hour12: false }); for (const f of fs.readdirSync(r.filePaths[0])) { if (!/\.(txt|md)$/i.test(f)) continue; dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,sort_order) VALUES (NULL,?,?,?,?,?,' + nextRootOrder() + ')', [f.replace(/\.(txt|md)$/i, ''), '📄', '', fs.readFileSync(path.join(r.filePaths[0], f), 'utf-8'), now]); count++ } saveDocFile(); mainWindow.webContents.send('doc:reloaded'); return { count } })
ipcMain.handle('imp:html', async () => { const r = await dialog.showOpenDialog(mainWindow, { title: '从 HTML 文件导入', filters: [{ name: 'HTML', extensions: ['html', 'htm'] }], properties: ['openFile'] }); if (r.canceled || !r.filePaths.length) return null; const fp = r.filePaths[0]; const now = new Date().toLocaleString('zh-CN', { hour12: false }); dbRun('INSERT INTO nodes (parent_id,name,icon,color,content,created_at,sort_order) VALUES (NULL,?,?,?,?,?,' + nextRootOrder() + ')', [path.basename(fp, path.extname(fp)), '🌐', '', stripHTML(fs.readFileSync(fp, 'utf-8')), now]); saveDocFile(); mainWindow.webContents.send('doc:reloaded'); return { id: dbLastId() } })
ipcMain.handle('imp:unsupported', (e, fmt) => { dialog.showMessageBox(mainWindow, { type: 'info', title: '导入', message: '暂不支持从 ' + fmt + ' 导入', detail: 'LimeTree 当前支持：TXT 文件、TXT 文件夹、HTML 文件、Markdown 文件导入。' }) })
ipcMain.handle('exp:txt', async (e, { node }) => { const r = await dialog.showSaveDialog(mainWindow, { title: '导出为纯文本', defaultPath: (node.name || 'limetree') + '.txt', filters: [{ name: '纯文本', extensions: ['txt'] }] }); if (r.canceled || !r.filePath) return null; fs.writeFileSync(r.filePath, typeof node.content === 'string' ? node.content : '', 'utf-8'); return { path: r.filePath } })
ipcMain.handle('exp:html', async (e, { node }) => { const r = await dialog.showSaveDialog(mainWindow, { title: '导出为 HTML', defaultPath: (node.name || 'limetree') + '.html', filters: [{ name: 'HTML', extensions: ['html'] }] }); if (r.canceled || !r.filePath) return null; let md; try { md = require('markdown-it')() } catch { md = null } let body = md ? md.render(typeof node.content === 'string' ? node.content : '') : '<pre>' + (node.content || '') + '</pre>'; fs.writeFileSync(r.filePath, `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${node.name || ''}</title><style>body{font-family:"Microsoft YaHei",sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7}pre{background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto}code{background:#f0f0f0;padding:1px 4px;border-radius:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f7fa}img{max-width:100%}blockquote{border-left:3px solid #4a90d9;padding-left:12px;color:#666}</style></head><body><h1>${node.icon || ''} ${node.name || ''}</h1><p style="color:#999;font-size:12px">创建时间: ${node.created_at || ''}</p>${body}</body></html>`, 'utf-8'); return { path: r.filePath } })
ipcMain.handle('exp:pdf', async (e, { node }) => { const r = await dialog.showSaveDialog(mainWindow, { title: '导出为 PDF', defaultPath: (node.name || 'limetree') + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] }); if (r.canceled || !r.filePath) return null; let md; try { md = require('markdown-it')() } catch { md = null } let body = md ? md.render(typeof node.content === 'string' ? node.content : '') : '<pre>' + (node.content || '') + '</pre>'; const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${node.name || ''}</title><style>body{font-family:"Microsoft YaHei",SimSun,sans-serif;max-width:700px;margin:30px auto;line-height:1.8;font-size:12pt}pre{background:#f6f8fa;padding:10px;border-radius:4px;white-space:pre-wrap;font-size:10pt}code{background:#f0f0f0;padding:1px 3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:5px;font-size:10pt}th{background:#f5f7fa}img{max-width:100%}blockquote{border-left:3px solid #4a90d9;padding-left:10px;color:#555}h1{font-size:18pt}h2{font-size:15pt}h3{font-size:13pt}</style></head><body><h1>${node.icon || ''} ${node.name || ''}</h1><p style="color:#888;font-size:9pt">创建时间: ${node.created_at || ''}</p>${body}</body></html>`; const win = new BrowserWindow({ show: false, webPreferences: {} }); await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)); const pdf = await win.webContents.printToPDF({ printBackground: true, margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } }); win.destroy(); fs.writeFileSync(r.filePath, pdf); return { path: r.filePath } })
ipcMain.handle('doc:print', () => { mainWindow.webContents.print({ silent: false, printBackground: true }); return { ok: true } })

/* ========== IPC: Replace All ========== */
ipcMain.handle('replace:all', (e, { find, replace }) => { if (!find) return { count: 0 }; let count = 0; for (const n of dbAll('SELECT id, content FROM nodes')) { const txt = typeof n.content === 'string' ? n.content : ''; if (txt.includes(find)) { count += txt.split(find).length - 1; dbRun('UPDATE nodes SET content=REPLACE(content,?,?) WHERE id=?', [find, replace, n.id]) } } saveDocFile(); return { count } })

/* ========== IPC: Dialogs & Clipboard ========== */
ipcMain.handle('dialog:select-image', async () => { const r = await dialog.showOpenDialog(mainWindow, { title: '选择图片', filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] }], properties: ['openFile'] }); if (r.canceled || !r.filePaths.length) return null; const fp = r.filePaths[0]; const buf = fs.readFileSync(fp); const ext = path.extname(fp).slice(1).toLowerCase(); const mime = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', bmp: 'bmp', webp: 'webp', svg: 'svg' }[ext] || 'png'; return { dataUrl: 'data:image/' + mime + ';base64,' + buf.toString('base64'), name: path.basename(fp) } })
ipcMain.handle('clipboard:read-text', () => clipboard.readText())
ipcMain.handle('clipboard:write-text', (e, t) => clipboard.writeText(t))

/* ========== Menu (from CherryTree ct_menu_ui.cc) ========== */
function M(label, accel, ch, extra) {
  const it = { label, click: () => { try { mainWindow.webContents.send('menu-action', ch) } catch(e) { console.error('menu send error:', e) } } }
  if (accel) it.accelerator = accel
  return Object.assign(it, extra || {})
}
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '文件(F)', submenu: [
      M('新建实例(N)', null, 'ct_new_inst'),
      M('打开文件夹(L)', 'Shift+Ctrl+O', 'ct_open_folder'),
      M('打开文件(O)', 'Ctrl+O', 'ct_open_file'),
      { label: '最近文档(R)', submenu: [] },
      { type: 'separator' },
      { label: '导入(I)', submenu: [
        M('从 CherryTree 文件夹导入...', null, 'import_ct_folder'),
        M('从 CherryTree 文件导入...', null, 'import_ct_file'),
        M('从缩进列表导入...', null, 'import_indented_list'),
        M('从 TXT 文件导入...', null, 'import_txt_file'),
        M('从 TXT 文件夹导入...', null, 'import_txt_folder'),
        M('从 HTML 文件导入...', null, 'import_html_file'),
        M('从 HTML 文件夹导入...', null, 'import_html_folder'),
        M('从 Markdown 文件导入...', null, 'import_md_file'),
        M('从 Markdown 文件夹导入...', null, 'import_md_folder'),
        M('从 Gnote 文件夹导入...', null, 'import_gnote'),
        M('从 KeepNote 文件夹导入...', null, 'import_keepnote'),
        M('从 Leo 文件导入...', null, 'import_leo'),
        M('从 Mempad 文件导入...', null, 'import_mempad'),
        M('从 NoteCase 文件导入...', null, 'import_notecase'),
        M('从 RedNotebook 文件夹导入...', null, 'import_rednotebook'),
        M('从 Tomboy 文件夹导入...', null, 'import_tomboy'),
        M('从 TreePad 文件导入...', null, 'import_treepad'),
        M('从 Zim 文件夹导入...', null, 'import_zim')
      ]},
      { label: '导出(E)', submenu: [
        M('导出为 PDF...', null, 'export_pdf'),
        M('导出为 HTML...', null, 'export_html'),
        M('导出为纯文本...', null, 'export_txt'),
        M('导出为 CherryTree 文档...', null, 'export_ct')
      ]},
      { type: 'separator' },
      M('保存并清理(V)', null, 'ct_vacuum'),
      M('保存(S)', 'Ctrl+S', 'ct_save'),
      M('另存为(A)', 'Shift+Ctrl+S', 'ct_save_as'),
      { type: 'separator' },
      M('页面设置(G)', null, 'print_page_setup'),
      M('打印(R)', 'Ctrl+P', 'do_print'),
      { type: 'separator' },
      { label: '设置(P)', submenu: [
        M('首选项...', null, 'preferences_dlg'),
        M('导入设置...', null, 'pref_import'),
        M('导出设置...', null, 'pref_export'),
        M('打开配置文件夹...', null, 'open_cfg_folder')
      ]},
      M('树信息(f)', null, 'tree_parse_info'),
      M('文档路径复制到剪贴板(D)', null, 'doc_path_clip'),
      { type: 'separator' },
      { label: '退出(Q)', accelerator: 'Ctrl+Q', click: () => app.quit() }
    ]},
    { label: '编辑(E)', submenu: [
      M('撤销', 'Ctrl+Z', 'act_undo'),
      M('重做', 'Ctrl+Y', 'act_redo'),
      { type: 'separator' },
      M('剪切', 'Ctrl+X', 'cut_plain'),
      M('复制', 'Ctrl+C', 'copy_plain'),
      M('粘贴', 'Ctrl+V', 'paste_plain'),
      { type: 'separator' },
      { label: '行(R)', submenu: [
        M('剪切行', null, 'cut_row'),
        M('复制行', null, 'copy_row'),
        M('重复行', 'Ctrl+D', 'dup_row'),
        M('上移行', 'Alt+Up', 'mv_up_row'),
        M('下移行', 'Alt+Down', 'mv_down_row'),
        M('删除行', 'Ctrl+K', 'del_row')
      ]},
      { type: 'separator' },
      { label: '表格(T)', submenu: [
        M('剪切表格', null, 'table_cut'), M('复制表格', null, 'table_copy'), M('删除表格', null, 'table_delete'),
        M('添加列', null, 'table_column_add'), M('删除列', null, 'table_column_delete'),
        M('左移列', null, 'table_column_left'), M('右移列', null, 'table_column_right'),
        M('增加列宽', null, 'table_column_increase_width'), M('减少列宽', null, 'table_column_decrease_width'),
        M('添加行', null, 'table_row_add'), M('删除行', null, 'table_row_delete'),
        M('上移行', null, 'table_row_up'), M('下移行', null, 'table_row_down'),
        M('降序排序行', null, 'table_rows_sort_descending'), M('升序排序行', null, 'table_rows_sort_ascending'),
        M('导出表格', null, 'table_export'), M('表格属性', null, 'table_edit_properties')
      ]},
      { label: '代码框(C)', submenu: [
        M('剪切代码框', null, 'codebox_cut'), M('复制代码框', null, 'codebox_copy'), M('删除代码框', null, 'codebox_delete'),
        M('增加宽度', null, 'codebox_increase_width'), M('减少宽度', null, 'codebox_decrease_width'),
        M('增加高度', null, 'codebox_increase_height'), M('减少高度', null, 'codebox_decrease_height'),
        M('从文件加载', null, 'codebox_load_from_file'), M('保存到文件', null, 'codebox_save_to_file'),
        M('代码框属性', null, 'codebox_change_properties')
      ]}
    ]},
    { label: '插入(I)', submenu: [
      M('插入图片...', null, 'handle_image'),
      M('插入表格...', null, 'handle_table'),
      M('插入代码框...', null, 'handle_codebox'),
      M('插入文件...', null, 'handle_embfile'),
      M('插入链接...', 'Ctrl+L', 'handle_link'),
      M('插入锚点...', null, 'handle_anchor'),
      M('插入目录', null, 'insert_toc'),
      M('插入时间戳', null, 'insert_timestamp'),
      M('插入特殊字符...', null, 'insert_special_char'),
      M('插入水平线', 'Ctrl+R', 'insert_horiz_rule'),
      { label: '列表(L)', submenu: [
        M('项目符号列表', null, 'handle_bull_list'),
        M('编号列表', null, 'handle_num_list'),
        M('待办事项列表', null, 'handle_todo_list')
      ]}
    ]},
    { label: '格式化(O)', submenu: [
      M('克隆格式', null, 'fmt_clone'), M('应用最近格式', 'F7', 'fmt_latest'), M('删除格式', 'Ctrl+Shift+R', 'fmt_rm'),
      { type: 'separator' },
      M('文本颜色...', null, 'fmt_color_fg'), M('文本背景色...', null, 'fmt_color_bg'),
      { type: 'separator' },
      { label: '字体属性(F)', submenu: [
        M('加粗', 'Ctrl+B', 'fmt_bold'), M('斜体', 'Ctrl+I', 'fmt_italic'), M('下划线', 'Ctrl+U', 'fmt_underline'),
        M('删除线', 'Ctrl+E', 'fmt_strikethrough'), M('等宽字体', 'Ctrl+M', 'fmt_monospace'),
        M('小号字', 'Ctrl+7', 'fmt_small'), M('下标', 'Ctrl+8', 'fmt_subscript'), M('上标', 'Ctrl+9', 'fmt_superscript')
      ]},
      { label: '大小写转换(C)', submenu: [
        M('小写', 'Ctrl+W', 'case_down'), M('大写', 'Ctrl+Shift+W', 'case_up'), M('切换大小写', 'Ctrl+G', 'case_tggl')
      ]},
      { label: '标题(H)', submenu: [
        M('标题1', 'Ctrl+1', 'fmt_h1'), M('标题2', 'Ctrl+2', 'fmt_h2'), M('标题3', 'Ctrl+3', 'fmt_h3'),
        M('标题4', 'Ctrl+4', 'fmt_h4'), M('标题5', 'Ctrl+5', 'fmt_h5'), M('标题6', 'Ctrl+6', 'fmt_h6')
      ]},
      { type: 'separator' },
      M('增加缩进', null, 'fmt_indent'), M('减少缩进', null, 'fmt_unindent'),
      { type: 'separator' },
      M('展开全部', null, 'head_expand'), M('折叠全部', null, 'head_collapse'),
      { type: 'separator' },
      { label: '对齐(J)', submenu: [
        M('左对齐', null, 'fmt_justify_left'), M('居中', null, 'fmt_justify_center'),
        M('右对齐', null, 'fmt_justify_right'), M('两端对齐', null, 'fmt_justify_fill')
      ]}
    ]},
    { label: '工具(L)', submenu: [
      M('拼写检查', null, 'spellcheck_toggle', { type: 'checkbox', checked: false }),
      { type: 'separator' },
      M('执行代码行', 'Ctrl+F5', 'exec_code_los'), M('执行全部代码', 'F5', 'exec_code_all'),
      M('去除行尾空格', null, 'strip_trail_spaces'), M('Tab 转空格', null, 'repl_tabs_spaces'),
      { type: 'separator' },
      M('命令面板...', 'Ctrl+Shift+P', 'command_palette')
    ]},
    { label: '树型(T)', submenu: [
      M('下一个节点', null, 'go_node_next'), M('上一个节点', null, 'go_node_prev'),
      { type: 'separator' },
      M('添加节点', 'Ctrl+N', 'tree_add_node'), M('添加子节点', 'Ctrl+Shift+N', 'tree_add_subnode'),
      M('重复节点', null, 'tree_dup_node'), M('重复节点及子节点', null, 'tree_dup_node_subnodes'),
      { type: 'separator' },
      M('节点属性', 'F2', 'tree_node_prop'), M('只读模式', null, 'tree_node_toggle_ro'),
      M('节点链接', null, 'tree_node_link'), M('子节点继承语法', null, 'child_nodes_inherit_syntax'),
      { type: 'separator' },
      M('添加到书签', null, 'node_bookmark'), M('从书签中删除', null, 'node_unbookmark'),
      { type: 'separator' },
      M('展开全部节点', 'Ctrl+Shift+E', 'nodes_all_expand'), M('折叠全部节点', 'Ctrl+Shift+L', 'nodes_all_collapse'),
      { type: 'separator' },
      { label: '移动(M)', submenu: [
        M('上移节点', null, 'tree_node_up'), M('下移节点', null, 'tree_node_down'),
        M('左移节点', null, 'tree_node_left'), M('右移节点', null, 'tree_node_right'),
        M('更改父节点...', null, 'tree_node_new_father')
      ]},
      { label: '排序(S)', submenu: [
        M('升序排序兄弟节点', null, 'tree_sibl_sort_asc'), M('降序排序兄弟节点', null, 'tree_sibl_sort_desc'),
        { type: 'separator' },
        M('升序排序全部节点', null, 'tree_all_sort_asc'), M('降序排序全部节点', null, 'tree_all_sort_desc')
      ]},
      { type: 'separator' },
      M('删除节点', null, 'tree_node_del')
    ]},
    { label: '搜索(S)', submenu: [
      M('快速选择节点...', null, 'select_node'),
      M('在节点名称中查找...', null, 'find_in_node_names'),
      M('在节点中查找...', 'Ctrl+F', 'find_in_node'),
      M('在所有节点中查找...', 'Ctrl+Shift+F', 'find_in_allnodes'),
      M('查找下一个', 'F3', 'find_iter_fw'), M('查找上一个', 'F4', 'find_iter_bw'),
      { type: 'separator' },
      M('替换节点中的内容...', 'Ctrl+H', 'replace_in_node'),
      M('替换所有节点中的内容...', 'Ctrl+Shift+H', 'replace_in_allnodes'),
      M('替换下一个', 'F6', 'replace_iter_fw'),
      { type: 'separator' },
      M('清除搜索排除', null, 'tree_clear_exclude_from_search'),
      M('显示所有匹配对话框', null, 'toggle_show_allmatches_dlg')
    ]},
    { label: '查看(V)', submenu: [
      M('显示树状视图', 'F9', 'toggle_show_tree', { type: 'checkbox', checked: true }),
      M('显示树线', null, 'toggle_show_treelines', { type: 'checkbox', checked: true }),
      M('显示菜单栏', 'F12', 'toggle_show_menubar', { type: 'checkbox', checked: true }),
      M('显示工具栏', null, 'toggle_show_toolbar', { type: 'checkbox', checked: true }),
      M('显示状态栏', null, 'toggle_show_statusbar', { type: 'checkbox', checked: true }),
      M('显示节点名称标题', null, 'toggle_show_node_name_head', { type: 'checkbox', checked: true }),
      { type: 'separator' },
      M('全屏切换', 'F11', 'toggle_fullscreen'), M('总在最前', null, 'toggle_always_on_top'),
      { type: 'separator' },
      M('切换树/编辑焦点', 'Ctrl+Tab', 'toggle_focus_tree_text'),
      { type: 'separator' },
      M('增大工具栏图标', null, 'toolbar_icons_size_p'), M('减小工具栏图标', null, 'toolbar_icons_size_m'),
      { type: 'separator' },
      M('增大字体', 'Ctrl+=', 'zoom_in'), M('减小字体', 'Ctrl+-', 'zoom_out')
    ]},
    { label: '书签(B)', submenu: [] },
    { label: '帮助(H)', submenu: [
      M('检查更新', null, 'ct_check_newer'),
      { type: 'separator' },
      M('主页', null, 'ct_homepage'), M('GitHub', null, 'ct_github'),
      M('问题反馈', null, 'ct_issues'), M('帮助', 'F1', 'ct_help'),
      { type: 'separator' },
      M('关于 LimeTree', null, 'ct_about')
    ]}
  ]))
}

/* ========== Window ========== */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: 'LimeTree', icon: path.join(__dirname, '..', 'build', 'icon.ico'),
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