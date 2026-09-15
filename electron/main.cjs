const { app, BrowserWindow, ipcMain, dialog, session, Menu, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let db = null
let dbPath = null
let needSave = false

/* ========== sql.js helpers ========== */
function dbRun(sql, params) {
  if (params && params.length > 0) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    stmt.step()
    stmt.free()
  } else {
    db.run(sql)
  }
  needSave = true
}
function dbGet(sql, params) {
  const stmt = db.prepare(sql)
  if (params) stmt.bind(params)
  let row = null
  if (stmt.step()) row = stmt.getAsObject()
  stmt.free()
  return row
}
function dbAll(sql, params) {
  const results = []
  const stmt = db.prepare(sql)
  if (params) stmt.bind(params)
  while (stmt.step()) results.push(stmt.getAsObject())
  stmt.free()
  return results
}
function dbLastId() {
  const r = db.exec('SELECT last_insert_rowid()')
  return r[0].values[0][0]
}
function saveDB() {
  if (!db || !dbPath || !needSave) return
  try {
    fs.writeFileSync(dbPath, Buffer.from(db.export()))
    needSave = false
  } catch (e) { console.error('Save error:', e) }
}

/* ========== Database Init ========== */
async function initDB() {
  const initSqlJs = require('sql.js')
  const sqlMain = require.resolve('sql.js')
  const wasm = fs.readFileSync(path.join(path.dirname(sqlMain), 'sql-wasm.wasm'))
  const SQL = await initSqlJs({ wasm })
  dbPath = path.join(app.getPath('userData'), 'limetree.db')
  let buf = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null
  db = buf ? new SQL.Database(new Uint8Array(buf)) : new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  db.run(`CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    name TEXT DEFAULT 'New Node',
    icon TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    sort_order INTEGER DEFAULT 0,
    is_expanded INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
  )`)
  const c = dbGet('SELECT COUNT(*) as c FROM nodes')
  if (c.c === 0) {
    const ts = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    dbRun("INSERT INTO nodes (parent_id,name,icon,content) VALUES (NULL,'我的笔记本','📔','# 我的笔记本\n\n> 创建时间: ' || datetime('now','localtime'))")
    const rid = dbLastId()
    dbRun("INSERT INTO nodes (parent_id,name,icon,content) VALUES (?, '欢迎使用 LimeTree','🌿','# 欢迎使用 LimeTree\n\n## 功能\n\n- 树形结构笔记\n- 图片可拖拽缩放\n- 表格可拖拽缩放\n- 代码框可拖拽缩放\n- Markdown 格式存储\n\n> 创建时间: ' || datetime('now','localtime'))", [rid])
    saveDB()
  }
  setInterval(saveDB, 5000)
}

/* ========== IPC: Tree ========== */
ipcMain.handle('db:get-tree', () => dbAll('SELECT * FROM nodes ORDER BY sort_order, id'))
ipcMain.handle('db:get-node', (e, id) => dbGet('SELECT * FROM nodes WHERE id=?', [id]))

ipcMain.handle('db:create-node', (e, { parentId, name, icon }) => {
  let so = 0
  if (parentId) {
    const m = dbGet('SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id=?', [parentId])
    so = m.m + 1
  } else {
    const m = dbGet("SELECT COALESCE(MAX(sort_order),-1) as m FROM nodes WHERE parent_id IS NULL")
    so = m.m + 1
  }
  const ts = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const defaultContent = '> 创建时间: ' + ts + '\n\n'
  dbRun("INSERT INTO nodes (parent_id,name,icon,content) VALUES (?,?,?,?)", [parentId || null, name || '新建节点', icon || '📄', defaultContent])
  const nid = dbLastId()
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDB()
  return { id: nid }
})

ipcMain.handle('db:update-node', (e, { id, fields }) => {
  const sets = [], vals = []
  for (const [k, v] of Object.entries(fields)) { sets.push(k + '=?'); vals.push(v) }
  sets.push("updated_at=datetime('now','localtime')")
  vals.push(id)
  dbRun('UPDATE nodes SET ' + sets.join(', ') + ' WHERE id=?', vals)
  saveDB()
  return { success: true }
})

function delRecursive(id) {
  for (const c of dbAll('SELECT id FROM nodes WHERE parent_id=?', [id])) delRecursive(c.id)
  dbRun('DELETE FROM nodes WHERE id=?', [id])
}
ipcMain.handle('db:delete-node', (e, id) => { delRecursive(id); saveDB(); return { success: true } })

ipcMain.handle('db:move-node', (e, { id, parentId, sortOrder }) => {
  if (id === parentId) return { success: false }
  let p = parentId
  while (p) {
    if (p === id) return { success: false }
    const r = dbGet('SELECT parent_id FROM nodes WHERE id=?', [p])
    p = r ? r.parent_id : null
  }
  dbRun("UPDATE nodes SET parent_id=?,sort_order=?,updated_at=datetime('now','localtime') WHERE id=?", [parentId, sortOrder, id])
  if (parentId) dbRun('UPDATE nodes SET is_expanded=1 WHERE id=?', [parentId])
  saveDB()
  return { success: true }
})

/* ========== IPC: Search ========== */
ipcMain.handle('db:search', (e, kw) => {
  if (!kw || !kw.trim()) return []
  const k = kw.trim().toLowerCase()
  const results = []
  for (const n of dbAll('SELECT id,parent_id,name,icon,content FROM nodes ORDER BY sort_order,id')) {
    const nm = n.name && n.name.toLowerCase().includes(k)
    let cm = false, snip = ''
    const txt = typeof n.content === 'string' ? n.content : ''
    if (txt && txt.toLowerCase().includes(k)) {
      cm = true
      const i = txt.toLowerCase().indexOf(k)
      snip = (i > 30 ? '...' : '') + txt.substring(Math.max(0, i - 30), i + k.length + 30) + (i + k.length + 30 < txt.length ? '...' : '')
    }
    if (nm || cm) results.push({ id: n.id, parent_id: n.parent_id, name: n.name, icon: n.icon, snippet: cm ? snip : '名称匹配' })
  }
  return results
})

/* ========== IPC: Export ========== */
ipcMain.handle('dialog:export-md', async (e, { node }) => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '导出 Markdown', defaultPath: (node.name || 'limetree') + '.md', filters: [{ name: 'Markdown', extensions: ['md'] }] })
  if (r.canceled || !r.filePath) return null
  const md = typeof node.content === 'string' ? node.content : ''
  fs.writeFileSync(r.filePath, `# ${node.icon || ''} ${node.name || ''}\n\n> 创建时间: ${node.created_at || ''}\n\n${md}`, 'utf-8')
  return { path: r.filePath }
})

ipcMain.handle('dialog:export-html', async (e, { node }) => {
  const r = await dialog.showSaveDialog(mainWindow, { title: '导出 HTML', defaultPath: (node.name || 'limetree') + '.html', filters: [{ name: 'HTML', extensions: ['html'] }] })
  if (r.canceled || !r.filePath) return null
  const md = typeof node.content === 'string' ? node.content : ''
  fs.writeFileSync(r.filePath, `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${node.name || ''}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7}pre{background:#f6f8fa;padding:12px;border-radius:6px}code{background:#f0f0f0;padding:1px 4px;border-radius:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f7fa}img{max-width:100%}</style></head><body><h1>${node.icon || ''} ${node.name || ''}</h1><pre>${md}</pre></body></html>`, 'utf-8')
  return { path: r.filePath }
})

/* ========== IPC: Image file dialog ========== */
ipcMain.handle('dialog:select-image', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { title: '选择图片', filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] }], properties: ['openFile'] })
  if (r.canceled || !r.filePaths.length) return null
  const fp = r.filePaths[0]
  const buf = fs.readFileSync(fp)
  const ext = path.extname(fp).slice(1).toLowerCase()
  const mime = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', bmp: 'bmp', webp: 'webp', svg: 'svg' }[ext] || 'png'
  return { dataUrl: 'data:image/' + mime + ';base64,' + buf.toString('base64'), name: path.basename(fp) }
})

/* ========== IPC: Clipboard ========== */
ipcMain.handle('clipboard:read-text', () => clipboard.readText())
ipcMain.handle('clipboard:write-text', (e, t) => clipboard.writeText(t))

/* ========== Menu ========== */
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '文件(F)', submenu: [
      { label: '新建节点', accelerator: 'Ctrl+N', click: () => mainWindow.webContents.send('menu:new-node') },
      { label: '新建子节点', accelerator: 'Shift+Ctrl+N', click: () => mainWindow.webContents.send('menu:new-child') },
      { type: 'separator' },
      { label: '保存', accelerator: 'Ctrl+S', click: () => mainWindow.webContents.send('menu:save') },
      { label: '导出为 Markdown', accelerator: 'Ctrl+E', click: () => mainWindow.webContents.send('menu:export') },
      { label: '导出为 HTML', click: () => mainWindow.webContents.send('menu:export-html') },
      { type: 'separator' },
      { label: '删除节点', accelerator: 'Delete', click: () => mainWindow.webContents.send('menu:delete-node') },
      { label: '重命名节点', accelerator: 'F2', click: () => mainWindow.webContents.send('menu:rename-node') },
      { type: 'separator' },
      { label: '退出', accelerator: 'Ctrl+Q', click: () => app.quit() }
    ]},
    { label: '编辑(E)', submenu: [
      { label: '撤销', accelerator: 'Ctrl+Z', click: () => mainWindow.webContents.send('menu:undo') },
      { label: '重做', accelerator: 'Ctrl+Y', click: () => mainWindow.webContents.send('menu:redo') },
      { type: 'separator' },
      { label: '剪切', accelerator: 'Ctrl+X', click: () => mainWindow.webContents.send('menu:cut') },
      { label: '复制', accelerator: 'Ctrl+C', click: () => mainWindow.webContents.send('menu:copy') },
      { label: '粘贴', click: () => {
        const img = clipboard.readImage()
        if (!img.isEmpty()) {
          const b64 = img.toPNG().toString('base64')
          mainWindow.webContents.executeJavaScript(`window.__ltPasteImg && window.__ltPasteImg('data:image/png;base64,${b64}')`)
        } else { mainWindow.webContents.send('menu:paste') }
      }},
      { label: '粘贴为纯文本', accelerator: 'Shift+Ctrl+V', click: () => mainWindow.webContents.send('menu:paste-plain') },
      { type: 'separator' },
      { label: '全选', accelerator: 'Ctrl+A', click: () => mainWindow.webContents.send('menu:select-all') },
      { label: '查找', accelerator: 'Ctrl+F', click: () => mainWindow.webContents.send('menu:find') }
    ]},
    { label: '插入(I)', submenu: [
      { label: '插入图片', click: () => mainWindow.webContents.send('menu:insert-image') },
      { label: '插入表格', click: () => mainWindow.webContents.send('menu:insert-table') },
      { label: '插入代码框', click: () => mainWindow.webContents.send('menu:insert-code') },
      { label: '插入分割线', click: () => mainWindow.webContents.send('menu:insert-hr') },
      { label: '插入引用', click: () => mainWindow.webContents.send('menu:insert-quote') }
    ]},
    { label: '格式(O)', submenu: [
      { label: '加粗', accelerator: 'Ctrl+B', click: () => mainWindow.webContents.send('menu:bold') },
      { label: '斜体', accelerator: 'Ctrl+I', click: () => mainWindow.webContents.send('menu:italic') },
      { label: '下划线', accelerator: 'Ctrl+U', click: () => mainWindow.webContents.send('menu:underline') },
      { label: '删除线', click: () => mainWindow.webContents.send('menu:strike') },
      { label: '行内代码', click: () => mainWindow.webContents.send('menu:code') },
      { type: 'separator' },
      { label: '标题1', click: () => mainWindow.webContents.send('menu:h1') },
      { label: '标题2', click: () => mainWindow.webContents.send('menu:h2') },
      { label: '标题3', click: () => mainWindow.webContents.send('menu:h3') },
      { type: 'separator' },
      { label: '无序列表', click: () => mainWindow.webContents.send('menu:bullet-list') },
      { label: '有序列表', click: () => mainWindow.webContents.send('menu:ordered-list') },
      { type: 'separator' },
      { label: '清除格式', click: () => mainWindow.webContents.send('menu:clear-format') }
    ]},
    { label: '查看(V)', submenu: [
      { label: '深色/浅色切换', click: () => mainWindow.webContents.send('menu:toggle-dark') },
      { type: 'separator' },
      { label: '放大', accelerator: 'Ctrl+=', role: 'zoomIn' },
      { label: '缩小', accelerator: 'Ctrl+-', role: 'zoomOut' },
      { label: '重置缩放', accelerator: 'Ctrl+0', role: 'resetZoom' },
      { type: 'separator' },
      { label: '全屏', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
    ]},
    { label: '帮助(H)', submenu: [
      { label: '关于 LimeTree', click: () => dialog.showMessageBox(mainWindow, {
        type: 'info', title: '关于 LimeTree', message: 'LimeTree v2.0.0',
        detail: '树形笔记本软件\n\n- 图片/表格/代码框可拖拽缩放\n- Markdown 格式存储\n- 节点时间戳\n\nGitHub: https://github.com/huanggshou/LimeTree',
        icon: path.join(__dirname, '..', 'build', 'icon.ico')
      })}
    ]}
  ]))
}

/* ========== Window ========== */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: 'LimeTree',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // INTERCEPT Ctrl+V BEFORE page — check clipboard for image
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'v' && (input.control || input.meta) && !input.shift) {
      const img = clipboard.readImage()
      if (!img.isEmpty()) {
        event.preventDefault()
        const b64 = img.toPNG().toString('base64')
        mainWindow.webContents.executeJavaScript(`window.__ltPasteImg && window.__ltPasteImg('data:image/png;base64,${b64}')`)
      }
      // If no image, let default paste happen (text)
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
app.on('before-quit', () => saveDB())
app.on('window-all-closed', () => { saveDB(); if (process.platform !== 'darwin') app.quit() })
