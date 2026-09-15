<template>
  <div class="app-container" :class="{ dark: darkMode }">
    <div class="tree-sidebar">
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
          <div><div class="search-result-name">{{ r.name }}</div><div v-if="r.snippet" class="search-result-snippet">{{ r.snippet }}</div></div>
        </div>
      </div>
      <template v-else>
        <div class="sidebar-header">
          <button @click="addRoot" title="添加根节点">+ 根节点</button>
          <button @click="addChild" :disabled="!selectedId" title="添加子节点">+ 子节点</button>
        </div>
        <div class="tree-container">
          <TreeItem v-for="n in rootNodes" :key="n.id" :node="n" :all-nodes="allNodes"
            :selected-id="selectedId" :level="0" :expanded-set="expandedSet"
            @select="onSelect" @delete="onDelete" @rename="onRename" @toggle="onToggle" @move="onMove" />
        </div>
      </template>
    </div>

    <div class="right-panel">
      <NoteEditor v-if="selectedNode" :key="selectedNode.id" :node="selectedNode"
        @save="onSave" @export="onExport" @export-html="onExportHTML"
        @add-sibling="addSibling" @add-child="addChild" @toggle-search="focusSearch" />
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

    <!-- Context menu -->
    <div v-if="menuVisible" class="ctx-menu" :style="{ left: menuX+'px', top: menuY+'px' }" @click.stop>
      <div class="ctx-item" @click="menuAddChild">添加子节点</div>
      <div class="ctx-item" @click="menuAddSibling">添加同级</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="menuRename">重命名</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="menuExport">导出为 Markdown</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item danger" @click="menuDelete" v-if="menuNodeId !== rootNodes[0]?.id">删除节点</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuNodeId = ref(null)
const saveStatus = ref('已保存')

const rootNodes = computed(() => allNodes.value.filter(n => !n.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))

async function loadTree() {
  allNodes.value = await window.api.getTree()
  const s = new Set()
  allNodes.value.forEach(n => { if (n.is_expanded) s.add(n.id) })
  expandedSet.value = s
}

function onToggle(id) {
  const s = new Set(expandedSet.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedSet.value = s
  window.api.updateNode({ id, fields: { is_expanded: s.has(id) ? 1 : 0 } })
}

async function onSelect(node) {
  selectedId.value = node.id
  selectedNode.value = await window.api.getNode(node.id)
}

async function onCreateNode({ parentId, name, icon }) {
  const result = await window.api.createNode({ parentId, name, icon })
  await loadTree()
  if (parentId && !expandedSet.value.has(parentId)) onToggle(parentId)
  const newNode = allNodes.value.find(n => n.id === result.id)
  if (newNode) await onSelect(newNode)
}

async function onDelete(id) {
  await window.api.deleteNode(id)
  await loadTree()
  if (selectedId.value === id) {
    selectedNode.value = null; selectedId.value = null
    const roots = allNodes.value.filter(n => !n.parent_id)
    if (roots.length > 0) {
      const kids = allNodes.value.filter(n => n.parent_id === roots[0].id)
      await onSelect(kids.length > 0 ? kids[0] : roots[0])
    }
  }
}

async function onRename({ id, name }) {
  await window.api.updateNode({ id, fields: { name } })
  await loadTree()
  if (selectedId.value === id) selectedNode.value = await window.api.getNode(id)
}

async function onMove({ id, parentId, sortOrder }) {
  const r = await window.api.moveNode({ id, parentId, sortOrder })
  if (r.success) await loadTree()
}

function addRoot() { onCreateNode({ parentId: null, name: '新建节点', icon: '📄' }) }
function addChild() { if (selectedId.value) onCreateNode({ parentId: selectedId.value, name: '新建节点', icon: '📄' }) }
function addSibling() {
  if (!selectedId.value) return
  const n = allNodes.value.find(x => x.id === selectedId.value)
  if (n) onCreateNode({ parentId: n.parent_id, name: '新建节点', icon: '📄' })
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searchResults.value = searchKw.value.trim() ? await window.api.searchNodes(searchKw.value) : []
  }, 300)
}
function clearSearch() { searchKw.value = ''; searchResults.value = [] }
function focusSearch() { if (searchInput.value) searchInput.value.focus() }

async function onSearchClick(r) {
  clearSearch()
  const n = allNodes.value.find(x => x.id === r.id)
  if (n) { let p = n.parent_id; while (p) { if (!expandedSet.value.has(p)) onToggle(p); const pn = allNodes.value.find(x => x.id === p); p = pn ? pn.parent_id : null } ; await onSelect(n) }
}

function onExport() { if (selectedNode.value) window.api.exportMD({ node: selectedNode.value }) }
function onExportHTML() { if (selectedNode.value) window.api.exportHTML({ node: selectedNode.value }) }

function toggleDark() { darkMode.value = !darkMode.value; localStorage.setItem('lt-dark', darkMode.value ? '1' : '0') }

function onCtxMenu(e) { menuX.value = e.detail.x; menuY.value = e.detail.y; menuNodeId.value = e.detail.nodeId; menuVisible.value = true }
function closeMenu() { menuVisible.value = false }
function menuAddChild() { onCreateNode({ parentId: menuNodeId.value, name: '新建节点', icon: '📄' }); if (!expandedSet.value.has(menuNodeId.value)) onToggle(menuNodeId.value); closeMenu() }
function menuAddSibling() { const n = allNodes.value.find(x => x.id === menuNodeId.value); if (n) onCreateNode({ parentId: n.parent_id, name: '新建节点', icon: '📄' }); closeMenu() }
function menuRename() { window.dispatchEvent(new CustomEvent('tree-rename', { detail: { id: menuNodeId.value } })); closeMenu() }
function menuDelete() { onDelete(menuNodeId.value); closeMenu() }
function menuExport() { const n = allNodes.value.find(x => x.id === menuNodeId.value); if (n) window.api.exportMD({ node: n }); closeMenu() }

let saveTimer = null
function onSave({ id, content }) {
  saveStatus.value = '保存中...'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    await window.api.updateNode({ id, fields: { content } })
    saveStatus.value = '已保存'
    if (selectedNode.value && selectedNode.value.id === id) selectedNode.value = { ...selectedNode.value, content }
  }, 300)
}

function handleMenu(ch) {
  switch (ch) {
    case 'menu:new-node': addSibling(); break
    case 'menu:new-child': addChild(); break
    case 'menu:save': saveStatus.value = '已保存'; break
    case 'menu:export': onExport(); break
    case 'menu:export-html': onExportHTML(); break
    case 'menu:delete-node': if (selectedId.value) onDelete(selectedId.value); break
    case 'menu:rename-node': if (selectedId.value) window.dispatchEvent(new CustomEvent('tree-rename', { detail: { id: selectedId.value } })); break
    case 'menu:find': focusSearch(); break
    case 'menu:toggle-dark': toggleDark(); break
    default: window.dispatchEvent(new CustomEvent('editor-menu', { detail: { action: ch } }))
  }
}

const menuChannels = ['menu:new-node','menu:new-child','menu:save','menu:export','menu:export-html','menu:delete-node','menu:rename-node',
  'menu:undo','menu:redo','menu:cut','menu:copy','menu:paste','menu:paste-plain','menu:select-all','menu:find',
  'menu:insert-image','menu:insert-table','menu:insert-code','menu:insert-hr','menu:insert-quote',
  'menu:bold','menu:italic','menu:underline','menu:strike','menu:code','menu:h1','menu:h2','menu:h3',
  'menu:bullet-list','menu:ordered-list','menu:clear-format','menu:toggle-dark']

onMounted(async () => {
  darkMode.value = localStorage.getItem('lt-dark') === '1'
  await loadTree()
  if (allNodes.value.length > 0) {
    const roots = allNodes.value.filter(n => !n.parent_id)
    if (roots.length > 0) {
      const kids = allNodes.value.filter(n => n.parent_id === roots[0].id)
      await onSelect(kids.length > 0 ? kids[0] : roots[0])
    }
  }
  window.addEventListener('tree-context-menu', onCtxMenu)
  window.addEventListener('click', closeMenu)
  menuChannels.forEach(ch => window.api.onMenu(ch, () => handleMenu(ch)))
})

onUnmounted(() => {
  window.removeEventListener('tree-context-menu', onCtxMenu)
  window.removeEventListener('click', closeMenu)
})
</script>
