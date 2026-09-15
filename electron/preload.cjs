const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getTree: () => ipcRenderer.invoke('db:get-tree'),
  getNode: (id) => ipcRenderer.invoke('db:get-node', id),
  createNode: (d) => ipcRenderer.invoke('db:create-node', d),
  updateNode: (d) => ipcRenderer.invoke('db:update-node', d),
  deleteNode: (id) => ipcRenderer.invoke('db:delete-node', id),
  moveNode: (d) => ipcRenderer.invoke('db:move-node', d),
  searchNodes: (kw) => ipcRenderer.invoke('db:search', kw),
  exportMD: (d) => ipcRenderer.invoke('dialog:export-md', d),
  exportHTML: (d) => ipcRenderer.invoke('dialog:export-html', d),
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  clipboardReadText: () => ipcRenderer.invoke('clipboard:read-text'),
  clipboardWriteText: (t) => ipcRenderer.invoke('clipboard:write-text', t),
  onMenu: (ch, cb) => { const h = (e, ...a) => cb(...a); ipcRenderer.on(ch, h); return () => ipcRenderer.removeListener(ch, h) }
})
