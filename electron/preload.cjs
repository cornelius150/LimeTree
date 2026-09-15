const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Tree
  getTree: () => ipcRenderer.invoke('db:get-tree'),
  getNode: (id) => ipcRenderer.invoke('db:get-node', id),
  createNode: (d) => ipcRenderer.invoke('db:create-node', d),
  updateNode: (d) => ipcRenderer.invoke('db:update-node', d),
  deleteNode: (id) => ipcRenderer.invoke('db:delete-node', id),
  moveNode: (d) => ipcRenderer.invoke('db:move-node', d),
  searchNodes: (kw) => ipcRenderer.invoke('db:search', kw),
  nodeUp: (id) => ipcRenderer.invoke('db:node-up', id),
  nodeDown: (id) => ipcRenderer.invoke('db:node-down', id),
  duplicateNode: (id) => ipcRenderer.invoke('db:duplicate-node', id),
  copyNode: (id) => ipcRenderer.invoke('db:copy-node', id),
  cutNode: (id) => ipcRenderer.invoke('db:cut-node', id),
  pasteNode: (d) => ipcRenderer.invoke('db:paste-node', d),
  sortChildren: (id) => ipcRenderer.invoke('db:sort-children', id),
  sortTree: () => ipcRenderer.invoke('db:sort-tree'),
  expandAll: () => ipcRenderer.invoke('db:expand-all'),
  collapseAll: () => ipcRenderer.invoke('db:collapse-all'),
  nodeInfo: (id) => ipcRenderer.invoke('db:node-info', id),
  replaceAllNodes: (d) => ipcRenderer.invoke('replace:all', d),
  // Bookmarks
  bmAdd: (id) => ipcRenderer.invoke('bm:add', id),
  bmRemove: (id) => ipcRenderer.invoke('bm:remove', id),
  bmList: () => ipcRenderer.invoke('bm:list'),
  // Document
  openDoc: () => ipcRenderer.invoke('doc:open'),
  saveDoc: () => ipcRenderer.invoke('doc:save'),
  saveDocAs: () => ipcRenderer.invoke('doc:save-as'),
  newInstance: () => ipcRenderer.invoke('doc:new-instance'),
  printDoc: () => ipcRenderer.invoke('doc:print'),
  // Import / Export
  importTxt: () => ipcRenderer.invoke('imp:txt'),
  importTxtFolder: () => ipcRenderer.invoke('imp:txt-folder'),
  importHtml: () => ipcRenderer.invoke('imp:html'),
  importUnsupported: (fmt) => ipcRenderer.invoke('imp:unsupported', fmt),
  exportTxt: (d) => ipcRenderer.invoke('exp:txt', d),
  exportHtml: (d) => ipcRenderer.invoke('exp:html', d),
  exportPdf: (d) => ipcRenderer.invoke('exp:pdf', d),
  // Dialogs / Clipboard
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  clipboardReadText: () => ipcRenderer.invoke('clipboard:read-text'),
  clipboardWriteText: (t) => ipcRenderer.invoke('clipboard:write-text', t),
  // ===== Single-channel menu event =====
  onMenuAction: (cb) => {
    const h = (e, action) => { try { cb(action) } catch(err) { console.error('onMenuAction callback error:', err) } }
    ipcRenderer.on('menu-action', h)
    return () => { try { ipcRenderer.removeListener('menu-action', h) } catch(e) {} }
  },
  onReload: (cb) => {
    const h = () => { try { cb() } catch(err) { console.error('onReload callback error:', err) } }
    ipcRenderer.on('doc:reloaded', h)
    return () => { try { ipcRenderer.removeListener('doc:reloaded', h) } catch(e) {} }
  }
})
