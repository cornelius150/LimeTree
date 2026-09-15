const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // 树
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
  changeNodeId: (d) => ipcRenderer.invoke('db:change-id', d),
  expandAll: () => ipcRenderer.invoke('db:expand-all'),
  collapseAll: () => ipcRenderer.invoke('db:collapse-all'),
  nodeInfo: (id) => ipcRenderer.invoke('db:node-info', id),
  replaceAllNodes: (d) => ipcRenderer.invoke('replace:all', d),
  // 书签
  bmAdd: (id) => ipcRenderer.invoke('bm:add', id),
  bmRemove: (id) => ipcRenderer.invoke('bm:remove', id),
  bmList: () => ipcRenderer.invoke('bm:list'),
  bmMove: (d) => ipcRenderer.invoke('bm:move', d),
  // 文档
  openDoc: () => ipcRenderer.invoke('doc:open'),
  saveDoc: () => ipcRenderer.invoke('doc:save'),
  saveDocAs: () => ipcRenderer.invoke('doc:save-as'),
  newInstance: () => ipcRenderer.invoke('doc:new-instance'),
  printDoc: () => ipcRenderer.invoke('doc:print'),
  // 导入导出
  importTxt: () => ipcRenderer.invoke('imp:txt'),
  importTxtFolder: () => ipcRenderer.invoke('imp:txt-folder'),
  importHtml: () => ipcRenderer.invoke('imp:html'),
  importUnsupported: (fmt) => ipcRenderer.invoke('imp:unsupported', fmt),
  exportTxt: (d) => ipcRenderer.invoke('exp:txt', d),
  exportHtml: (d) => ipcRenderer.invoke('exp:html', d),
  exportPdf: (d) => ipcRenderer.invoke('exp:pdf', d),
  // 对话框/剪贴板
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  clipboardReadText: () => ipcRenderer.invoke('clipboard:read-text'),
  clipboardWriteText: (t) => ipcRenderer.invoke('clipboard:write-text', t),
  // ===== 单通道菜单事件 =====
  onMenuAction: (cb) => {
    const h = (e, action) => cb(action)
    ipcRenderer.on('menu-action', h)
    return () => ipcRenderer.removeListener('menu-action', h)
  },
  onReload: (cb) => {
    const h = () => cb()
    ipcRenderer.on('doc:reloaded', h)
    return () => ipcRenderer.removeListener('doc:reloaded', h)
  }
})
