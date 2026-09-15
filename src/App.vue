<template>
  <div class="app-container" :class="{ dark: darkMode }">
    <!-- ================= 左侧面板 ================= -->
    <div class="tree-sidebar" v-show="showTree">
      <div class="sidebar-title">
        <img src="./assets/lime-icon-small.png" alt="LimeTree" class="sidebar-logo" />
        <span class="sidebar-title-text">LimeTree</span>
        <button class="theme-toggle" @click="toggleDark">{{ darkMode ? '☀' : '☾' }}</button>
      </div>
      <div class="search-bar">
        <input v-model="searchKw" type="text" placeholder="搜索笔记..." @input="onSearch" ref="searchInput" />
        <button v-if="searchKw" class="search-clear" @click="clearSearch">✕</button>
      </div>
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="search-results-header">找到 {{ searchResults.length }} 个结果</div>
        <div v-for="r in searchResults" :key="r.id" class="search-result-item" @click="onSearchClick(r)">
          <span class="search-result-icon">{{ r.icon || '📄' }}</span>
          <div>
            <div class="search-result-name">{{ r.name }}</div>
            <div v-if="r.snippet" class="search-result-snippet">{{ r.snippet }}</div>
          </div>
        </div>
      </div>
      <template v-else>
        <div class="sidebar-header">
          <button @click="addRoot" title="添加根节点">+ 根节点</button>
          <button @click="addChild" :disabled="!selectedId" title="添加子节点">+ 子节点</button>
        </div>
        <div class="tree-container" @keydown="onTreeKey" tabindex="0" ref="treeContainer">
          <TreeItem v-for="n in rootNodes" :key="n.id" :node="n" :all-nodes="allNodes"
            :selected-id="selectedId" :level="0" :expanded-set="expandedSet"
            @select="onSelect" @delete="onDelete" @rename="onRename" @toggle="onToggle" @move="onMove" />
        </div>
        <!-- 书签区 -->
        <div v-if="bookmarks.length > 0" class="bookmarks-section">
          <div class="bookmarks-header">书签</div>
          <div v-for="b in bookmarks" :key="b.id" class="bookmark-item" @click="gotoBookmark(b)">
            <span class="bm-icon">{{ b.icon || '📄' }}</span>
            <span class="bm-name">{{ b.name }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- ================= 右侧编辑区 ================= -->
    <div class="right-panel">
      <NoteEditor v-if="selectedNode" :key="selectedNode.id" :node="selectedNode"
        :show-toolbar="showToolbar" :wrap-line="wrapLine" :show-ln="showLn" :show-ws="showWs" :show-le="showLe"
        @save="onSave" @app-menu="handleMenu" />
      <div v-else class="empty-state">
        <div style="text-align:center">
          <img src="./assets/lime-icon.png" alt="LimeTree" style="width:96px;height:96px;opacity:0.7" />
          <p style="margin-top:12px;font-size:18px;color:#999">LimeTree 笔记本</p>
        </div>
      </div>
      <div class="status-bar" v-if="selectedNode">
        <span>{{ (selectedNode.content || '').length }} 字符</span>
        <span>{{ selectedNode.name || '' }}</span>
        <span style="margin-left:auto">{{ saveStatus }}</span>
      </div>
    </div>

    <!-- ================= 树右键菜单 ================= -->
    <div v-if="menuVisible" class="ctx-menu" :style="{ left: menuX+'px', top: menuY+'px' }" @click.stop>
      <div class="ctx-item" @click="mAct('add-child')">添加子节点</div>
      <div class="ctx-item" @click="mAct('add-sibling')">添加同级</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="mAct('rename')">重命名</div>
      <div class="ctx-item" @click="mAct('node-icon')">更改节点图标</div>
      <div class="ctx-item" @click="mAct('node-color')">更改高亮颜色</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="mAct('node-up')">上移节点</div>
      <div class="ctx-item" @click="mAct('node-down')">下移节点</div>
      <div class="ctx-item" @click="mAct('dup-node')">重复节点</div>
      <div class="ctx-item" @click="mAct('copy-node')">复制节点</div>
      <div class="ctx-item" @click="mAct('cut-node')">剪切节点</div>
      <div class="ctx-item" @click="mAct('paste-node')" :class="{disabled: !hasNodeClip}">粘贴节点</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="mAct('sort-children')">排序节点</div>
      <div class="ctx-item" @click="mAct('expand-all')">展开全部</div>
      <div class="ctx-item" @click="mAct('collapse-all')">折叠全部</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="mAct('bm-add')">添加节点到书签</div>
      <div class="ctx-item" @click="mAct('bm-remove')">从书签中删除节点</div>
      <div class="ctx-item" @click="mAct('node-info')">节点信息</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="mAct('exp-html')">导出为 HTML</div>
      <div class="ctx-item" @click="mAct('exp-txt')">导出为纯文本</div>
      <div class="ctx-item" @click="mAct('exp-pdf')">导出为 PDF</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item danger" @click="mAct('delete')" v-if="menuNodeId !== rootNodes[0]?.id">删除节点</div>
    </div>

    <!-- ================= 节点信息对话框 ================= -->
    <div v-if="infoDlg" class="modal-overlay" @click.self="infoDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">节点信息</div>
        <div class="modal-body" v-if="nodeInfo">
          <div class="info-row"><span>ID:</span><strong>{{ nodeInfo.id }}</strong></div>
          <div class="info-row"><span>名称:</span><strong>{{ nodeInfo.name }}</strong></div>
          <div class="info-row"><span>图标:</span><strong>{{ nodeInfo.icon }}</strong></div>
          <div class="info-row"><span>创建时间:</span><strong>{{ nodeInfo.created }}</strong></div>
          <div class="info-row"><span>修改时间:</span><strong>{{ nodeInfo.updated }}</strong></div>
          <div class="info-row"><span>字符数:</span><strong>{{ nodeInfo.chars }}</strong></div>
          <div class="info-row"><span>单词数:</span><strong>{{ nodeInfo.words }}</strong></div>
          <div class="info-row"><span>子节点数:</span><strong>{{ nodeInfo.children }}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-ok" @click="infoDlg = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ================= 更改 ID 对话框 ================= -->
    <div v-if="idDlg" class="modal-overlay" @click.self="idDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">更改节点 ID</div>
        <div class="modal-body">
          <div class="modal-field"><label>新 ID</label><input type="number" v-model.number="newId" /></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="idDlg = false">取消</button>
          <button class="modal-btn modal-btn-ok" @click="confirmChangeId">确定</button>
        </div>
      </div>
    </div>

    <!-- ================= 图标选择对话框 ================= -->
    <div v-if="iconDlg" class="modal-overlay" @click.self="iconDlg = false">
      <div class="modal-dialog" style="max-width:420px">
        <div class="modal-title">更改节点图标</div>
        <div class="icon-grid">
          <span v-for="ic in iconList" :key="ic" class="icon-pick" @click="pickIcon(ic)">{{ ic }}</span>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="iconDlg = false">取消</button>
        </div>
      </div>
    </div>

    <!-- ================= 颜色选择对话框 ================= -->
    <div v-if="colorDlg" class="modal-overlay" @click.self="colorDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">更改高亮颜色</div>
        <div class="color-grid">
          <span v-for="c in hlColors" :key="c" class="color-pick" :style="{ background: c }" @click="pickColor(c)"></span>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="colorDlg = false">无颜色</button>
        </div>
      </div>
    </div>

    <!-- ================= 书签管理对话框 ================= -->
    <div v-if="bmDlg" class="modal-overlay" @click.self="bmDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">处理书签</div>
        <div class="modal-body">
          <div v-for="(b, i) in bmEditList" :key="b.id" class="bm-edit-item">
            <span>{{ b.icon || '📄' }} {{ b.name }}</span>
            <button class="bm-btn" @click="bmMove(b.id, -1)" :disabled="i===0">↑</button>
            <button class="bm-btn" @click="bmMove(b.id, 1)" :disabled="i===bmEditList.length-1">↓</button>
            <button class="bm-btn danger" @click="bmRemove(b.id)">✕</button>
          </div>
          <div v-if="bmEditList.length === 0" style="text-align:center;color:#999;padding:20px">暂无书签</div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-ok" @click="bmDlg = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import TreeItem from './components/TreeItem.vue'
import NoteEditor from './components/NoteEditor.vue'

const allNodes = ref([])
const selectedId = ref(null)
const selectedNode = ref(null)
const darkMode = ref(false)
const expandedSet = ref(new Set())
const searchKw = ref('')
const searchResults = ref([])
const searchInput = ref(null)
let searchTimer = null
const menuVisible = ref(false); const menuX = ref(0); const menuY = ref(0); const menuNodeId = ref(null)
const saveStatus = ref('已保存')
const treeContainer = ref(null)

/* 视图状态 */
const showToolbar = ref(true); const showTree = ref(true); const wrapLine = ref(true)
const showLn = ref(false); const showWs = ref(false); const showLe = ref(false)
let zoomFactor = 1.0

/* 书签 */
const bookmarks = ref([]); const bmDlg = ref(false); const bmEditList = ref([])

/* 对话框状态 */
const infoDlg = ref(false); const nodeInfo = ref(null)
const idDlg = ref(false); const newId = ref(0)
const iconDlg = ref(false); const colorDlg = ref(false)

const iconList = ['📄','📔','📋','📌','📍','🔖','🏷','🌟','⭐','💡','🔑','🔒','🔓','🛡','⚙','🔧','🔨','🛠','💻','🖥','⌨','🖱','💾','💿','📁','📂','🗂','🗃','📦','📦','📤','📥','📨','📩','📧','📥','📝','✏','🖋','🖊','🖌','🖍','🎯','🏷','🎓','📚','📖','📰','🗞','📓','📔','📒','📕','📗','📘','📙','🔗','⛓','✅','☑','☐','❌','⛔','🔔','🔕','🎵','🎶','🎨','🎬','📷','🖼','🧩','🎲','🎮','🕹','🎰','🏆','🥇','🥈','🥉','🎁','🎂','🎉','🎊','🚀','🌍','🌎','🌏','🌐','🔬','🔭','🧪','🧫','🧬','💊','💉','🌡','🩺','🌱','🌿','☘','🍀','🍃','🌾','🌷','🌹','🌻','🌼','🌸','🌺','🍄','🌰','🎃','🐚','🪨','☀','🌙','⭐','🌟','✨','⚡','🔥','💧','🌊','❄','🌈','🍃','🌿']
const hlColors = ['','transparent','#ffd0d0','#ffe599','#fff2cc','#d9ead3','#cfe2f3','#d9d2e9','#ffd9b3','#d0e0ff','#e6ccff','#cccccc','#ff9999','#ffcc66','#ffff66','#99cc66','#66cccc','#6666cc','#cc66cc','#ff6666','#ffaa33','#ffff00','#66cc33','#33cccc','#3366cc','#cc33cc','#808080','#cc0000','#e69100','#bf9000','#38761d','#134f5c','#0b5394','#741b47','#666666','#dd0000','#b45f06','#783f04','#274e13','#0c343d','#073763','#4c1130','#333333']
let hasNodeClip = ref(false)

const rootNodes = computed(() => allNodes.value.filter(n => !n.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))

/* ================= 加载 ================= */
async function loadTree() {
  allNodes.value = await window.api.getTree()
  const s = new Set(); allNodes.value.forEach(n => { if (n.is_expanded) s.add(n.id) }); expandedSet.value = s
  bookmarks.value = await window.api.bmList()
}
function onToggle(id) {
  const s = new Set(expandedSet.value); s.has(id) ? s.delete(id) : s.add(id); expandedSet.value = s
  window.api.updateNode({ id, fields: { is_expanded: s.has(id) ? 1 : 0 } })
}
async function onSelect(node) { selectedId.value = node.id; selectedNode.value = await window.api.getNode(node.id) }
async function onCreateNode({ parentId, name, icon }) {
  const result = await window.api.createNode({ parentId, name, icon })
  await loadTree()
  if (parentId && !expandedSet.value.has(parentId)) onToggle(parentId)
  const newNode = allNodes.value.find(n => n.id === result.id)
  if (newNode) await onSelect(newNode)
}
async function onDelete(id) {
  await window.api.deleteNode(id); await loadTree()
  if (selectedId.value === id) { selectedNode.value = null; selectedId.value = null
    const roots = allNodes.value.filter(n => !n.parent_id)
    if (roots.length > 0) { const kids = allNodes.value.filter(n => n.parent_id === roots[0].id); await onSelect(kids.length > 0 ? kids[0] : roots[0]) }
  }
}
async function onRename({ id, name }) { await window.api.updateNode({ id, fields: { name } }); await loadTree(); if (selectedId.value === id) selectedNode.value = await window.api.getNode(id) }
async function onMove({ id, parentId, sortOrder }) { const r = await window.api.moveNode({ id, parentId, sortOrder }); if (r.success) await loadTree() }

function addRoot() { onCreateNode({ parentId: null, name: '新建节点', icon: '📄' }) }
function addChild() { if (selectedId.value) onCreateNode({ parentId: selectedId.value, name: '新建节点', icon: '📄' }) }
function addSibling() { const n = allNodes.value.find(x => x.id === selectedId.value); if (n) onCreateNode({ parentId: n.parent_id, name: '新建节点', icon: '📄' }) }

/* ================= 搜索 ================= */
function onSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(async () => { searchResults.value = searchKw.value.trim() ? await window.api.searchNodes(searchKw.value) : [] }, 300) }
function clearSearch() { searchKw.value = ''; searchResults.value = [] }
function focusSearch() { if (searchInput.value) searchInput.value.focus() }
async function onSearchClick(r) {
  clearSearch()
  const n = allNodes.value.find(x => x.id === r.id)
  if (n) { let p = n.parent_id; while (p) { if (!expandedSet.value.has(p)) onToggle(p); const pn = allNodes.value.find(x => x.id === p); p = pn ? pn.parent_id : null }; await onSelect(n) }
}

/* ================= 树键盘（Delete 删除节点） ================= */
function onTreeKey(e) {
  if (e.key === 'Delete' && selectedId.value && treeContainer.value?.contains(document.activeElement)) {
    e.preventDefault(); onDelete(selectedId.value)
  }
}

/* ================= 树右键菜单 ================= */
function onCtxMenu(e) { menuX.value = e.detail.x; menuY.value = e.detail.y; menuNodeId.value = e.detail.nodeId; menuVisible.value = true }
function closeMenu() { menuVisible.value = false }
function mAct(action) {
  const id = menuNodeId.value; closeMenu()
  if (!id && action !== 'paste-node' && action !== 'expand-all' && action !== 'collapse-all') return
  switch (action) {
    case 'add-child': onCreateNode({ parentId: id, name: '新建节点', icon: '📄' }); break
    case 'add-sibling': { const n = allNodes.value.find(x => x.id === id); if (n) onCreateNode({ parentId: n.parent_id, name: '新建节点', icon: '📄' }); break }
    case 'rename': window.dispatchEvent(new CustomEvent('tree-rename', { detail: { id } })); break
    case 'node-icon': iconDlg.value = true; break
    case 'node-color': colorDlg.value = true; break
    case 'node-up': window.api.nodeUp(id).then(() => loadTree()); break
    case 'node-down': window.api.nodeDown(id).then(() => loadTree()); break
    case 'dup-node': window.api.duplicateNode(id).then(() => loadTree()); break
    case 'copy-node': window.api.copyNode(id).then(() => hasNodeClip.value = true); break
    case 'cut-node': window.api.cutNode(id).then(() => { hasNodeClip.value = true; loadTree() }); break
    case 'paste-node': window.api.pasteNode({ targetId: id }).then(() => loadTree()); break
    case 'sort-children': window.api.sortChildren(id).then(() => loadTree()); break
    case 'expand-all': window.api.expandAll().then(() => loadTree()); break
    case 'collapse-all': window.api.collapseAll().then(() => loadTree()); break
    case 'bm-add': window.api.bmAdd(id).then(() => bookmarks.value = window.api.bmList()); break
    case 'bm-remove': window.api.bmRemove(id).then(() => bookmarks.value = window.api.bmList()); break
    case 'node-info': showNodeInfo(id); break
    case 'exp-html': window.api.exportHtml({ node: allNodes.value.find(x => x.id === id) }); break
    case 'exp-txt': window.api.exportTxt({ node: allNodes.value.find(x => x.id === id) }); break
    case 'exp-pdf': window.api.exportPdf({ node: allNodes.value.find(x => x.id === id) }); break
    case 'delete': onDelete(id); break
  }
}
async function pickIcon(ic) { await window.api.updateNode({ id: menuNodeId.value, fields: { icon: ic } }); iconDlg.value = false; await loadTree() }
async function pickColor(c) { await window.api.updateNode({ id: menuNodeId.value, fields: { color: c || '' } }); colorDlg.value = false; await loadTree() }
async function showNodeInfo(id) { nodeInfo.value = await window.api.nodeInfo(id); infoDlg.value = true }

/* ================= 书签 ================= */
async function gotoBookmark(b) { clearSearch(); const n = allNodes.value.find(x => x.id === b.id); if (n) { let p = n.parent_id; while (p) { if (!expandedSet.value.has(p)) onToggle(p); const pn = allNodes.value.find(x => x.id === p); p = pn ? pn.parent_id : null }; await onSelect(n) } }
function openBmHandle() { bmEditList.value = [...bookmarks.value]; bmDlg.value = true }
async function bmMove(id, dir) { await window.api.bmMove({ id, dir }); bookmarks.value = await window.api.bmList(); bmEditList.value = [...bookmarks.value] }
async function bmRemove(id) { await window.api.bmRemove(id); bookmarks.value = await window.api.bmList(); bmEditList.value = [...bookmarks.value] }

/* ================= 保存 ================= */
let saveTimer = null
function onSave({ id, content }) {
  saveStatus.value = '保存中...'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => { await window.api.updateNode({ id, fields: { content } }); saveStatus.value = '已保存'
    if (selectedNode.value && selectedNode.value.id === id) selectedNode.value = { ...selectedNode.value, content } }, 300)
}

/* ================= 视图 ================= */
function toggleDark() { darkMode.value = !darkMode.value; localStorage.setItem('lt-dark', darkMode.value ? '1' : '0') }
function setZoom(delta) { zoomFactor = Math.max(0.3, Math.min(3, zoomFactor + delta)); document.body.style.zoom = zoomFactor }

/* ================= 菜单事件总分发 ================= */
function handleMenu(ch) {
  if (!ch) return
  const appActions = {
    'menu:new-instance': () => window.api.newInstance(),
    'menu:open': () => window.api.openDoc(),
    'menu:save': async () => { await window.api.saveDoc(); saveStatus.value = '已保存' },
    'menu:save-as': async () => { await window.api.saveDocAs(); saveStatus.value = '已保存' },
    'menu:print': () => window.api.printDoc(),
    'menu:add-node': () => addSibling(),
    'menu:add-child': () => addChild(),
    'menu:dup-node': () => { if (selectedId.value) window.api.duplicateNode(selectedId.value).then(() => loadTree()) },
    'menu:node-up': () => { if (selectedId.value) window.api.nodeUp(selectedId.value).then(() => loadTree()) },
    'menu:node-down': () => { if (selectedId.value) window.api.nodeDown(selectedId.value).then(() => loadTree()) },
    'menu:delete-node': () => { if (selectedId.value) onDelete(selectedId.value) },
    'menu:rename-node': () => { if (selectedId.value) window.dispatchEvent(new CustomEvent('tree-rename', { detail: { id: selectedId.value } })) },
    'menu:node-icon': () => { if (selectedId.value) { menuNodeId.value = selectedId.value; iconDlg.value = true } },
    'menu:node-color': () => { if (selectedId.value) { menuNodeId.value = selectedId.value; colorDlg.value = true } },
    'menu:node-info': () => { if (selectedId.value) showNodeInfo(selectedId.value) },
    'menu:change-id': () => { if (selectedId.value) { newId.value = selectedId.value; idDlg.value = true } },
    'menu:sort-children': () => { if (selectedId.value) window.api.sortChildren(selectedId.value).then(() => loadTree()) },
    'menu:sort-tree': () => window.api.sortTree().then(() => loadTree()),
    'menu:expand-all': () => window.api.expandAll().then(() => loadTree()),
    'menu:collapse-all': () => window.api.collapseAll().then(() => loadTree()),
    'menu:cut-node': () => { if (selectedId.value) { window.api.cutNode(selectedId.value).then(() => { hasNodeClip.value = true; loadTree() }) } },
    'menu:copy-node': () => { if (selectedId.value) window.api.copyNode(selectedId.value).then(() => hasNodeClip.value = true) },
    'menu:paste-node': () => { if (selectedId.value) window.api.pasteNode({ targetId: selectedId.value }).then(() => loadTree()) },
    'menu:bm-add': () => { if (selectedId.value) window.api.bmAdd(selectedId.value).then(() => bookmarks.value = window.api.bmList()) },
    'menu:bm-remove': () => { if (selectedId.value) window.api.bmRemove(selectedId.value).then(() => bookmarks.value = window.api.bmList()) },
    'menu:bm-handle': () => openBmHandle(),
    'menu:find-all': () => focusSearch(),
    'menu:iter-find': () => focusSearch(),
    'menu:exp-pdf': () => { if (selectedNode.value) window.api.exportPdf({ node: selectedNode.value }) },
    'menu:exp-txt': () => { if (selectedNode.value) window.api.exportTxt({ node: selectedNode.value }) },
    'menu:exp-html': () => { if (selectedNode.value) window.api.exportHtml({ node: selectedNode.value }) },
    'menu:imp-txt': () => window.api.importTxt(),
    'menu:imp-txt-folder': () => window.api.importTxtFolder(),
    'menu:imp-html': () => window.api.importHtml(),
    'menu:view-toolbar': () => showToolbar.value = !showToolbar.value,
    'menu:view-tree': () => showTree.value = !showTree.value,
    'menu:view-ln': () => showLn.value = !showLn.value,
    'menu:view-ws': () => showWs.value = !showWs.value,
    'menu:view-le': () => showLe.value = !showLe.value,
    'menu:view-wrap': () => wrapLine.value = !wrapLine.value,
    'menu:zoom-in': () => setZoom(0.1),
    'menu:zoom-out': () => setZoom(-0.1),
    'menu:zoom-reset': () => { zoomFactor = 1.0; document.body.style.zoom = 1 },
    'menu:check-update': () => window.open('https://github.com/cornelius150/LimeTree/releases', '_blank'),
    'menu:help': () => window.open('https://github.com/cornelius150/LimeTree#readme', '_blank'),
    'menu:about': () => { alert('LimeTree v2.1.0\n树形笔记本软件\n\n与 CherryTree 一致的九大菜单\n图片/表格/代码框可拖拽缩放\nMarkdown 格式存储 (.md)\n节点时间戳\n\nGitHub: https://github.com/cornelius150/LimeTree') }
  }
  /* 导入不支持格式 */
  const impFmts = { 'menu:imp-ct': 'CherryTree', 'menu:imp-gnote': 'Gnote', 'menu:imp-keepnote': 'KeepNote', 'menu:imp-keynote': 'KeyNote', 'menu:imp-knowit': 'Knowit', 'menu:imp-leo': 'Leo', 'menu:imp-mempad': 'Mempad', 'menu:imp-notecase': 'NoteCase', 'menu:imp-rednotebook': 'RedNotebook', 'menu:imp-tomboy': 'Tomboy', 'menu:imp-treepad': 'TreePad', 'menu:imp-tuxcards': 'TuxCards', 'menu:imp-zim': 'Zim' }
  if (impFmts[ch]) { window.api.importUnsupported(impFmts[ch]); return }
  /* 替换所有节点 */
  if (ch === 'menu:replace-all') {
    const find = prompt('查找内容：'); if (!find) return
    const replace = prompt('替换为：', ''); if (replace === null) return
    window.api.replaceAllNodes({ find, replace }).then(r => { alert(`已替换 ${r.count} 处`); loadTree(); if (selectedId.value) onSelect({ id: selectedId.value }) })
    return
  }
  if (appActions[ch]) { appActions[ch](); return }
  /* 其余编辑器相关菜单事件转发 */
  window.dispatchEvent(new CustomEvent('editor-menu', { detail: { action: ch } }))
}
async function confirmChangeId() {
  if (!newId.value || !menuNodeId.value && !selectedId.value) return
  const id = menuNodeId.value || selectedId.value
  const r = await window.api.changeNodeId({ id, newId: newId.value })
  if (r.success) { idDlg.value = false; await loadTree() } else { alert(r.reason || '更改 ID 失败') }
}

/* ================= 注册单通道菜单事件 ================= */

onMounted(async () => {
  darkMode.value = localStorage.getItem('lt-dark') === '1'
  await loadTree()
  if (allNodes.value.length > 0) { const roots = allNodes.value.filter(n => !n.parent_id); if (roots.length > 0) { const kids = allNodes.value.filter(n => n.parent_id === roots[0].id); await onSelect(kids.length > 0 ? kids[0] : roots[0]) } }
  window.addEventListener('tree-context-menu', onCtxMenu)
  window.addEventListener('click', closeMenu)
  window.api.onMenuAction((action) => handleMenu(action))
  window.api.onReload(async () => { await loadTree(); if (allNodes.value.length > 0) { const roots = allNodes.value.filter(n => !n.parent_id); if (roots.length > 0) { const kids = allNodes.value.filter(n => n.parent_id === roots[0].id); await onSelect(kids.length > 0 ? kids[0] : roots[0]) } } })
})

onUnmounted(() => {
  window.removeEventListener('tree-context-menu', onCtxMenu)
  window.removeEventListener('click', closeMenu)
})
</script>
