<template>
  <div class="lt-app">
    <!-- ===== 树形面板 ===== -->
    <div class="lt-tree-panel" v-show="showTree">
      <!-- 搜索框 -->
      <div class="lt-tree-search">
        <input
          v-model="treeSearchKw"
          class="lt-tree-search-input"
          placeholder="搜索节点..."
          @keydown.enter="doTreeSearch"
        />
        <button class="lt-tree-search-btn" @click="doTreeSearch" title="搜索">🔍</button>
      </div>

      <!-- 树 -->
      <div class="lt-tree-list">
        <template v-for="node in rootNodes" :key="node.id">
          <TreeItem
            :node="node"
            :allNodes="allNodes"
            :activeId="activeId"
            :expandedSet="expandedSet"
            @select="onSelectNode"
            @toggle-expand="onToggleExpand"
            @rename="onRenameNode"
            @context-menu="onTreeContextMenu"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drop-node="onDropNode"
          />
        </template>
        <div v-if="rootNodes.length === 0" class="lt-tree-empty">暂无节点，按 Ctrl+N 添加</div>
      </div>

      <!-- 书签区 -->
      <div class="lt-bookmarks" v-if="bookmarks.length > 0">
        <div class="lt-bookmarks-title">书签</div>
        <div
          v-for="bm in bookmarks"
          :key="bm.id"
          class="lt-bookmark-item"
          @click="onSelectNode({ id: bm.id, name: bm.name, icon: bm.icon })"
        >
          <span class="lt-bm-icon">{{ bm.icon || '📌' }}</span>
          <span class="lt-bm-name">{{ bm.name }}</span>
        </div>
      </div>
    </div>

    <!-- ===== 拖拽分隔条 ===== -->
    <div class="lt-splitter" @mousedown="startSplitDrag" v-show="showTree"></div>

    <!-- ===== 编辑区 ===== -->
    <div class="lt-editor-panel">
      <div class="lt-editor-header" v-show="showNodeNameHead">
        <span class="lt-editor-header-icon">{{ currentNode?.icon || '' }}</span>
        <span class="lt-editor-header-name">{{ currentNode?.name || 'LimeTree' }}</span>
      </div>
      <NoteEditor
        ref="editorRef"
        :content="currentContent"
        @editor-menu="onEditorMenuFromChild"
        @save-content="onSaveContent"
      />
    </div>

    <!-- ===== 树右键菜单 ===== -->
    <div v-if="showTreeMenu" class="lt-context-menu" :style="{ left: treeMenuX + 'px', top: treeMenuY + 'px' }" @click.stop>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_add_subnode')">添加子节点</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_add_node')">添加同级节点</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_node_prop')">重命名</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('change_icon')">更改图标</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('change_color')">更改颜色</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_node_up')">上移</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_node_down')">下移</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('copy_node')">复制</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('cut_node')">剪切</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('paste_node')">粘贴</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('tree_sibl_sort_asc')">排序子节点(升序)</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('nodes_all_expand')">展开全部</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('nodes_all_collapse')">折叠全部</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('node_bookmark')">添加到书签</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('node_unbookmark')">从书签删除</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('export_txt')">导出为文本</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('export_html')">导出为 HTML</div>
      <div class="lt-ctx-item" @click.stop="treeMenuAction('export_pdf')">导出为 PDF</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item lt-ctx-danger" @click.stop="treeMenuAction('tree_node_del')">删除节点</div>
    </div>

    <!-- ===== 全局搜索对话框 ===== -->
    <div v-if="showSearchDialog" class="lt-modal-overlay" @click="showSearchDialog=false">
      <div class="lt-search-dialog" @click.stop>
        <div class="lt-search-dialog-title">在所有节点中查找</div>
        <div class="lt-search-dialog-body">
          <div class="lt-search-row">
            <input v-model="searchKw" class="lt-search-input" placeholder="搜索内容..." @keydown.enter="doSearchAll" />
          </div>
          <div class="lt-search-options">
            <label class="lt-search-opt"><input type="checkbox" v-model="searchCaseSensitive" /> 区分大小写</label>
            <label class="lt-search-opt"><input type="checkbox" v-model="searchWholeWord" /> 完整单词</label>
            <label class="lt-search-opt"><input type="checkbox" v-model="searchRegex" /> 正则表达式</label>
            <label class="lt-search-opt"><input type="checkbox" v-model="searchMultiWord" /> 多词匹配</label>
          </div>
          <div class="lt-search-row">
            <label>搜索方向:
              <select v-model="searchDirection" class="lt-search-select">
                <option value="forward">向前</option>
                <option value="backward">向后</option>
              </select>
            </label>
            <label>搜索范围:
              <select v-model="searchScope" class="lt-search-select">
                <option value="all">所有节点</option>
                <option value="content">节点内容</option>
                <option value="name">节点名称</option>
              </select>
            </label>
          </div>
          <div class="lt-search-row">
            <label>时间筛选:
              <select v-model="searchTimeFilter" class="lt-search-select">
                <option value="">无</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </label>
          </div>
          <div class="lt-search-results" v-if="searchResults.length > 0">
            <div
              v-for="r in searchResults"
              :key="r.id"
              class="lt-search-result-item"
              @click="jumpToSearchResult(r)"
            >
              <span class="lt-sr-icon">{{ r.icon || '📄' }}</span>
              <span class="lt-sr-name">{{ r.name }}</span>
              <span class="lt-sr-snippet">{{ r.snippet }}</span>
            </div>
          </div>
          <div class="lt-search-empty" v-else-if="searchDone && searchResults.length === 0">未找到匹配结果</div>
        </div>
        <div class="lt-search-dialog-footer">
          <button class="lt-modal-btn" @click="showSearchDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="doSearchAll">确定</button>
        </div>
      </div>
    </div>

    <!-- ===== 设置对话框 ===== -->
    <div v-if="showSettingsDialog" class="lt-modal-overlay" @click="showSettingsDialog=false">
      <div class="lt-settings-dialog" @click.stop>
        <div class="lt-settings-sidebar">
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='general'}" @click="settingsTab='general'">常规</div>
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='editor'}" @click="settingsTab='editor'">编辑器</div>
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='tree'}" @click="settingsTab='tree'">树型</div>
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='font'}" @click="settingsTab='font'">字体</div>
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='theme'}" @click="settingsTab='theme'">主题</div>
          <div class="lt-settings-nav-item" :class="{active: settingsTab==='export'}" @click="settingsTab='export'">导出</div>
        </div>
        <div class="lt-settings-content">
          <div v-if="settingsTab==='general'" class="lt-settings-section">
            <h3>常规设置</h3>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.showTreeOnStart" /> 启动时显示树面板</label>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.autoSave" /> 自动保存</label>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.showStatusbar" /> 显示状态栏</label>
          </div>
          <div v-if="settingsTab==='editor'" class="lt-settings-section">
            <h3>编辑器设置</h3>
            <label class="lt-settings-item">默认字体:
              <select v-model="settings.editorFont" class="lt-settings-select">
                <option>Microsoft YaHei</option><option>SimSun</option><option>SimHei</option>
                <option>KaiTi</option><option>Consolas</option><option>Arial</option>
              </select>
            </label>
            <label class="lt-settings-item">默认字号:
              <input type="number" v-model.number="settings.editorFontSize" min="8" max="48" class="lt-settings-input" />
            </label>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.spellcheck" /> 拼写检查</label>
          </div>
          <div v-if="settingsTab==='tree'" class="lt-settings-section">
            <h3>树型设置</h3>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.showTreeLines" /> 显示树线</label>
            <label class="lt-settings-item"><input type="checkbox" v-model="settings.expandOnStart" /> 启动时展开所有节点</label>
          </div>
          <div v-if="settingsTab==='font'" class="lt-settings-section">
            <h3>字体设置</h3>
            <label class="lt-settings-item">编辑区字体:
              <select v-model="settings.contentFont" class="lt-settings-select">
                <option>Microsoft YaHei</option><option>SimSun</option><option>SimHei</option>
                <option>KaiTi</option><option>Consolas</option>
              </select>
            </label>
            <label class="lt-settings-item">行高:
              <input type="number" v-model.number="settings.lineHeight" min="1" max="3" step="0.1" class="lt-settings-input" />
            </label>
          </div>
          <div v-if="settingsTab==='theme'" class="lt-settings-section">
            <h3>主题</h3>
            <label class="lt-settings-item"><input type="radio" v-model="settings.theme" value="light" /> 浅色</label>
            <label class="lt-settings-item"><input type="radio" v-model="settings.theme" value="dark" /> 深色</label>
          </div>
          <div v-if="settingsTab==='export'" class="lt-settings-section">
            <h3>导出设置</h3>
            <label class="lt-settings-item">默认导出格式:
              <select v-model="settings.exportFormat" class="lt-settings-select">
                <option value="pdf">PDF</option><option value="html">HTML</option><option value="txt">TXT</option>
              </select>
            </label>
          </div>
        </div>
        <div class="lt-settings-footer">
          <button class="lt-modal-btn" @click="showSettingsDialog=false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ===== 节点信息对话框 ===== -->
    <div v-if="showNodeInfoDialog" class="lt-modal-overlay" @click="showNodeInfoDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">节点信息</div>
        <div class="lt-modal-body">
          <div class="lt-info-row"><label>节点 ID:</label> <span>{{ nodeInfoData?.id }}</span></div>
          <div class="lt-info-row"><label>名称:</label> <span>{{ nodeInfoData?.name }}</span></div>
          <div class="lt-info-row"><label>图标:</label> <span>{{ nodeInfoData?.icon }}</span></div>
          <div class="lt-info-row"><label>创建时间:</label> <span>{{ nodeInfoData?.created }}</span></div>
          <div class="lt-info-row"><label>更新时间:</label> <span>{{ nodeInfoData?.updated }}</span></div>
          <div class="lt-info-row"><label>字符数:</label> <span>{{ nodeInfoData?.chars }}</span></div>
          <div class="lt-info-row"><label>单词数:</label> <span>{{ nodeInfoData?.words }}</span></div>
          <div class="lt-info-row"><label>子节点数:</label> <span>{{ nodeInfoData?.children }}</span></div>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showNodeInfoDialog=false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ===== 图标选择对话框 ===== -->
    <div v-if="showIconDialog" class="lt-modal-overlay" @click="showIconDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">选择图标</div>
        <div class="lt-modal-body">
          <div class="lt-icon-grid">
            <span
              v-for="icon in iconList"
              :key="icon"
              class="lt-icon-cell"
              :class="{ 'lt-icon-selected': iconPickerValue === icon }"
              @click.stop="iconPickerValue = icon"
            >{{ icon }}</span>
          </div>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showIconDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="confirmIcon">确定</button>
        </div>
      </div>
    </div>

    <!-- ===== 颜色选择对话框 ===== -->
    <div v-if="showColorDialog" class="lt-modal-overlay" @click="showColorDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">选择颜色</div>
        <div class="lt-modal-body">
          <div class="lt-color-grid">
            <div
              v-for="c in colorList"
              :key="c"
              class="lt-color-cell"
              :style="{ background: c === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : c }"
              @click.stop="colorPickerValue = c"
            ></div>
          </div>
          <div class="lt-info-row" style="margin-top:8px">已选: {{ colorPickerValue }}</div>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showColorDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="confirmColor">确定</button>
        </div>
      </div>
    </div>

    <!-- ===== 更改 ID 对话框 ===== -->
    <div v-if="showChangeIdDialog" class="lt-modal-overlay" @click="showChangeIdDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">更改节点 ID</div>
        <div class="lt-modal-body">
          <label>新 ID: <input type="number" v-model.number="newNodeId" class="lt-modal-input" /></label>
          <p style="color:#e74c3c;margin-top:8px;font-size:12px">警告：更改 ID 可能导致子节点关系断裂！</p>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showChangeIdDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="confirmChangeId">确定</button>
        </div>
      </div>
    </div>

    <!-- ===== 状态栏 ===== -->
    <div class="lt-statusbar" v-show="showStatusbar">
      <span class="lt-status-item">节点: {{ currentNode?.name || '-' }}</span>
      <span class="lt-status-item">ID: {{ currentNode?.id || '-' }}</span>
      <span class="lt-status-item">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TreeItem from './components/TreeItem.vue'
import NoteEditor from './components/NoteEditor.vue'

// ====== 响应式状态 ======
const allNodes = ref([])
const activeId = ref(null)
const currentNode = ref(null)
const currentContent = ref('')
const expandedSet = ref(new Set())
const bookmarks = ref([])
const editorRef = ref(null)
const statusMessage = ref('就绪')

// ====== 面板可见性 ======
const showTree = ref(true)
const showStatusbar = ref(true)
const showNodeNameHead = ref(true)
const showToolbar = ref(true)

// ====== 树搜索 ======
const treeSearchKw = ref('')

// ====== 树右键菜单 ======
const showTreeMenu = ref(false)
const treeMenuX = ref(0)
const treeMenuY = ref(0)
const treeMenuNode = ref(null)

// ====== 全局搜索对话框 ======
const showSearchDialog = ref(false)
const searchKw = ref('')
const searchCaseSensitive = ref(false)
const searchWholeWord = ref(false)
const searchRegex = ref(false)
const searchMultiWord = ref(false)
const searchDirection = ref('forward')
const searchScope = ref('all')
const searchTimeFilter = ref('')
const searchResults = ref([])
const searchDone = ref(false)

// ====== 设置对话框 ======
const showSettingsDialog = ref(false)
const settingsTab = ref('general')
const settings = reactive({
  showTreeOnStart: true,
  autoSave: true,
  showStatusbar: true,
  editorFont: 'Microsoft YaHei',
  editorFontSize: 14,
  spellcheck: false,
  showTreeLines: true,
  expandOnStart: false,
  contentFont: 'Microsoft YaHei',
  lineHeight: 1.7,
  theme: 'light',
  exportFormat: 'pdf',
})

// ====== 节点信息 ======
const showNodeInfoDialog = ref(false)
const nodeInfoData = ref(null)

// ====== 图标选择 ======
const showIconDialog = ref(false)
const iconPickerValue = ref('')
let iconPickerCallback = null
const iconList = [
  '📄','📔','📁','📂','📝','🗒','🗓','📊','📈','📉','🔧','🔨','⭐','⭐','❤','💡','🔔','🔒','🔑','🎯',
  '🎨','🎵','📷','🎥','🌐','🔗','📌','🏷','✅','❌','⚠','🔥','🚀','💻','📱','🛠','📚','✏️','🖊️','🧩',
  '🏗','🌱','🌟','⚡','🛡','🌐','📦','🏆','🎁','🎈',
]

// ====== 颜色选择 ======
const showColorDialog = ref(false)
const colorPickerValue = ref('')
let colorPickerCallback = null
const colorList = [
  'transparent','#fefbf5','#fff8dc','#f0f0f0','#e8e8e8','#d6eaf8','#d5f5e3','#fdebd0','#fadbd8','#e8daef',
  '#ff0000','#ff6600','#ff9900','#ffcc00','#99cc00','#33cc00','#0099cc','#0066ff','#9900cc','#ff00cc',
  '#cc0000','#993300','#666600','#006633','#003366','#330066','#663366','#333333','#666666','#999999',
]

// ====== 更改 ID ======
const showChangeIdDialog = ref(false)
const newNodeId = ref(0)

// ====== 计算属性 ======
const rootNodes = computed(() => {
  let nodes = allNodes.value.filter((n) => n.parent_id === null || n.parent_id === undefined)
  nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  return nodes
})

// ====== 数据加载 ======
async function loadTree() {
  try {
    allNodes.value = await window.api.getTree()
    // 恢复展开状态
    allNodes.value.forEach((n) => {
      if (n.is_expanded) expandedSet.value.add(n.id)
    })
  } catch (e) {
    console.error('loadTree error:', e)
    allNodes.value = []
  }
}

async function loadBookmarks() {
  try {
    bookmarks.value = await window.api.bmList()
  } catch (e) {
    console.error('loadBookmarks error:', e)
    bookmarks.value = []
  }
}

// ====== 节点操作 ======
async function onSelectNode(node) {
  if (!node || !node.id) return
  activeId.value = node.id
  try {
    const full = await window.api.getNode(node.id)
    currentNode.value = full
    currentContent.value = full.content || ''
  } catch (e) {
    console.error('getNode error:', e)
  }
}

function onToggleExpand(id) {
  if (expandedSet.value.has(id)) {
    expandedSet.value.delete(id)
    try { window.api.updateNode({ id, fields: { is_expanded: 0 } }) } catch {}
  } else {
    expandedSet.value.add(id)
    try { window.api.updateNode({ id, fields: { is_expanded: 1 } }) } catch {}
  }
  // 触发响应式
  expandedSet.value = new Set(expandedSet.value)
}

async function onRenameNode({ id, name }) {
  try {
    await window.api.updateNode({ id, fields: { name } })
    const n = allNodes.value.find((x) => x.id === id)
    if (n) n.name = name
    if (currentNode.value?.id === id) currentNode.value.name = name
    statusMessage.value = '已重命名'
  } catch (e) {
    console.error('rename error:', e)
  }
}

async function addNode(parentId) {
  try {
    const r = await window.api.createNode({ parentId, name: '新建节点', icon: '📄' })
    if (r && r.id) {
      await loadTree()
      await onSelectNode({ id: r.id, name: '新建节点', icon: '📄' })
      if (parentId) expandedSet.value.add(parentId)
      expandedSet.value = new Set(expandedSet.value)
      statusMessage.value = '已添加节点'
    }
  } catch (e) {
    console.error('addNode error:', e)
  }
}

async function deleteNode(id) {
  try {
    await window.api.deleteNode(id)
    if (currentNode.value?.id === id) {
      currentNode.value = null
      currentContent.value = ''
      activeId.value = null
    }
    await loadTree()
    await loadBookmarks()
    statusMessage.value = '已删除节点'
  } catch (e) {
    console.error('deleteNode error:', e)
  }
}

async function moveNodeUp(id) {
  try { await window.api.nodeUp(id) } catch {}
  await loadTree()
}
async function moveNodeDown(id) {
  try { await window.api.nodeDown(id) } catch {}
  await loadTree()
}

async function copyNode(id) {
  try { await window.api.copyNode(id); statusMessage.value = '已复制' } catch (e) { console.error(e) }
}
async function cutNode(id) {
  try { await window.api.cutNode(id); statusMessage.value = '已剪切' } catch (e) { console.error(e) }
}
async function pasteNode(targetId) {
  try { await window.api.pasteNode({ targetId }); await loadTree(); statusMessage.value = '已粘贴' } catch (e) { console.error(e) }
}

async function sortChildren(id) {
  try { await window.api.sortChildren(id); await loadTree(); statusMessage.value = '已排序' } catch (e) { console.error(e) }
}

async function expandAll() {
  try { await window.api.expandAll(); await loadTree(); allNodes.value.forEach((n) => expandedSet.value.add(n.id)); expandedSet.value = new Set(expandedSet.value) } catch (e) { console.error(e) }
}
async function collapseAll() {
  try { await window.api.collapseAll(); await loadTree(); expandedSet.value.clear(); expandedSet.value = new Set() } catch (e) { console.error(e) }
}

async function toggleBookmark(id) {
  try {
    const exists = bookmarks.value.find((b) => b.id === id)
    if (exists) { await window.api.bmRemove(id); statusMessage.value = '已从书签删除' }
    else { await window.api.bmAdd(id); statusMessage.value = '已添加到书签' }
    await loadBookmarks()
  } catch (e) { console.error(e) }
}

// ====== 内容保存 ======
async function onSaveContent(md) {
  if (!currentNode.value || !activeId.value) return
  try {
    await window.api.updateNode({ id: activeId.value, fields: { content: md } })
    currentNode.value.content = md
  } catch (e) {
    console.error('save content error:', e)
  }
}

// ====== 树右键菜单 ======
function onTreeContextMenu({ event, node }) {
  treeMenuNode.value = node
  treeMenuX.value = event.clientX
  treeMenuY.value = event.clientY
  showTreeMenu.value = true
  // 选中的菜单节点也设为活动节点
  activeId.value = node.id
}

async function treeMenuAction(action) {
  const node = treeMenuNode.value
  showTreeMenu.value = false
  if (!node) return
  try {
    switch (action) {
      case 'tree_add_subnode': await addNode(node.id); break
      case 'tree_add_node': await addNode(node.parent_id); break
      case 'tree_node_prop':
        // 重命名通过 dispatch rename
        const newName = prompt('新名称:', node.name)
        if (newName && newName !== node.name) await onRenameNode({ id: node.id, name: newName })
        break
      case 'change_icon':
        iconPickerValue.value = node.icon || ''
        iconPickerCallback = async (icon) => {
          try { await window.api.updateNode({ id: node.id, fields: { icon } }); await loadTree(); if (currentNode.value?.id === node.id) currentNode.value.icon = icon } catch (e) { console.error(e) }
        }
        showIconDialog.value = true
        break
      case 'change_color':
        colorPickerValue.value = node.color || 'transparent'
        colorPickerCallback = async (color) => {
          try { await window.api.updateNode({ id: node.id, fields: { color: color === 'transparent' ? '' : color } }); await loadTree() } catch (e) { console.error(e) }
        }
        showColorDialog.value = true
        break
      case 'tree_node_up': await moveNodeUp(node.id); break
      case 'tree_node_down': await moveNodeDown(node.id); break
      case 'copy_node': await copyNode(node.id); break
      case 'cut_node': await cutNode(node.id); break
      case 'paste_node': await pasteNode(node.id); break
      case 'tree_sibl_sort_asc': await sortChildren(node.id); break
      case 'nodes_all_expand': await expandAll(); break
      case 'nodes_all_collapse': await collapseAll(); break
      case 'node_bookmark': await toggleBookmark(node.id); break
      case 'node_unbookmark': await toggleBookmark(node.id); break
      case 'export_txt': await exportNode('txt', node); break
      case 'export_html': await exportNode('html', node); break
      case 'export_pdf': await exportNode('pdf', node); break
      case 'tree_node_del':
        if (confirm('确定删除节点 "' + node.name + '" 及其所有子节点?')) await deleteNode(node.id)
        break
    }
  } catch (e) {
    console.error('treeMenuAction error:', action, e)
  }
}

function confirmIcon() {
  showIconDialog.value = false
  if (iconPickerCallback) iconPickerCallback(iconPickerValue.value)
}
function confirmColor() {
  showColorDialog.value = false
  if (colorPickerCallback) colorPickerCallback(colorPickerValue.value)
}
function confirmChangeId() {
  showChangeIdDialog.value = false
  statusMessage.value = 'ID 更改功能暂不可用'
}

// ====== 导出 ======
async function exportNode(fmt, node) {
  try {
    const full = node.id ? await window.api.getNode(node.id) : currentNode.value
    if (!full) return
    if (fmt === 'txt') await window.api.exportTxt({ node: full })
    else if (fmt === 'html') await window.api.exportHtml({ node: full })
    else if (fmt === 'pdf') await window.api.exportPdf({ node: full })
    statusMessage.value = '已导出 ' + fmt.toUpperCase()
  } catch (e) { console.error('export error:', e) }
}

// ====== 拖拽排序 ======
let draggedNode = null
function onDragStart(node) { draggedNode = node }
function onDragEnd() { draggedNode = null }
async function onDropNode({ draggedId, targetId }) {
  if (draggedId === targetId) return
  try {
    await window.api.moveNode({ id: draggedId, parentId: targetId, sortOrder: 0 })
    await loadTree()
  } catch (e) { console.error('drop error:', e) }
}

// ====== 树搜索 ======
async function doTreeSearch() {
  if (!treeSearchKw.value.trim()) return
  try {
    const results = await window.api.searchNodes(treeSearchKw.value)
    if (results.length > 0) {
      await onSelectNode(results[0])
      statusMessage.value = `找到 ${results.length} 个结果`
    } else {
      statusMessage.value = '未找到匹配节点'
    }
  } catch (e) { console.error(e) }
}

// ====== 全局搜索 ======
async function doSearchAll() {
  if (!searchKw.value.trim()) return
  searchDone.value = false
  try {
    searchResults.value = await window.api.searchNodes(searchKw.value)
    searchDone.value = true
  } catch (e) {
    console.error(e)
    searchResults.value = []
    searchDone.value = true
  }
}

function jumpToSearchResult(r) {
  showSearchDialog.value = false
  onSelectNode(r)
}

// ====== 分隔条拖拽 ======
function startSplitDrag(e) {
  e.preventDefault()
  const startX = e.clientX
  const treePanel = document.querySelector('.lt-tree-panel')
  const startW = treePanel ? treePanel.offsetWidth : 250
  const onMove = (ev) => {
    const newW = Math.max(150, Math.min(500, startW + ev.clientX - startX))
    if (treePanel) treePanel.style.width = newW + 'px'
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ====== 编辑器菜单转发 ======
function onEditorMenuFromChild(action) {
  // 从 NoteEditor 转发出来的 action（NoteEditor 内部已处理编辑器操作，
  // 只有需要 App 层处理的才到达这里）
  handleMenu(action)
}

// ====== handleMenu: 主菜单分发 ======
const appActions = {
  // --- 文件 ---
  ct_new_inst: () => { try { window.api.newInstance() } catch {} },
  ct_open_folder: async () => { try { await window.api.importTxtFolder(); await reloadAll() } catch {} },
  ct_open_file: async () => { try { await window.api.openDoc(); } catch {} },
  ct_vacuum: async () => { try { await window.api.saveDoc(); statusMessage.value = '已保存并清理' } catch {} },
  ct_save: async () => { try { await window.api.saveDoc(); statusMessage.value = '已保存' } catch {} },
  ct_save_as: async () => { try { await window.api.saveDocAs(); statusMessage.value = '已另存为' } catch {} },
  print_page_setup: () => { statusMessage.value = '页面设置（请在打印对话框中设置）' },
  do_print: async () => { try { await window.api.printDoc() } catch {} },
  preferences_dlg: () => { showSettingsDialog.value = true },
  tree_parse_info: async () => {
    try {
      const info = { nodes: allNodes.value.length, bookmarks: bookmarks.value.length }
      alert(`树信息\n节点总数: ${info.nodes}\n书签数: ${info.bookmarks}`)
    } catch {}
  },
  doc_path_clip: async () => { try { await window.api.clipboardWriteText('LimeTree Document'); statusMessage.value = '路径已复制' } catch {} },

  // --- 导入 ---
  import_txt_file: async () => { try { await window.api.importTxt(); await reloadAll() } catch {} },
  import_txt_folder: async () => { try { await window.api.importTxtFolder(); await reloadAll() } catch {} },
  import_html_file: async () => { try { await window.api.importHtml(); await reloadAll() } catch {} },
  import_md_file: async () => { try { await window.api.importTxt(); await reloadAll() } catch {} },
  import_ct_file: () => { try { window.api.importUnsupported('CherryTree') } catch {} },
  import_gnote: () => { try { window.api.importUnsupported('Gnote') } catch {} },
  import_keepnote: () => { try { window.api.importUnsupported('KeepNote') } catch {} },
  import_leo: () => { try { window.api.importUnsupported('Leo') } catch {} },
  import_mempad: () => { try { window.api.importUnsupported('Mempad') } catch {} },
  import_notecase: () => { try { window.api.importUnsupported('NoteCase') } catch {} },
  import_rednotebook: () => { try { window.api.importUnsupported('RedNotebook') } catch {} },
  import_tomboy: () => { try { window.api.importUnsupported('Tomboy') } catch {} },
  import_treepad: () => { try { window.api.importUnsupported('TreePad') } catch {} },
  import_zim: () => { try { window.api.importUnsupported('Zim') } catch {} },

  // --- 导出 ---
  export_pdf: async () => { await exportNode('pdf', currentNode.value || {}) },
  export_html: async () => { await exportNode('html', currentNode.value || {}) },
  export_txt: async () => { await exportNode('txt', currentNode.value || {}) },
  export_ct: () => { statusMessage.value = 'CherryTree 导出暂不可用' },

  // --- 树型 ---
  go_node_next: () => navigateNode(1),
  go_node_prev: () => navigateNode(-1),
  tree_add_node: async () => {
    const pid = currentNode.value?.parent_id
    await addNode(pid)
  },
  tree_add_subnode: async () => {
    const pid = activeId.value
    await addNode(pid)
  },
  tree_dup_node: async () => {
    try { await window.api.duplicateNode(activeId.value); await loadTree() } catch (e) { console.error(e) }
  },
  tree_dup_node_subnodes: async () => {
    try { await window.api.duplicateNode(activeId.value); await loadTree() } catch (e) { console.error(e) }
  },
  tree_node_prop: async () => {
    if (!currentNode.value) return
    const newName = prompt('新名称:', currentNode.value.name)
    if (newName) await onRenameNode({ id: activeId.value, name: newName })
  },
  tree_node_toggle_ro: () => { statusMessage.value = '只读模式切换' },
  tree_node_link: () => { statusMessage.value = '节点链接' },
  child_nodes_inherit_syntax: () => { statusMessage.value = '子节点继承语法' },
  node_bookmark: async () => { if (activeId.value) await toggleBookmark(activeId.value) },
  node_unbookmark: async () => { if (activeId.value) await toggleBookmark(activeId.value) },
  nodes_all_expand: async () => { await expandAll() },
  nodes_all_collapse: async () => { await collapseAll() },
  tree_node_up: async () => { if (activeId.value) await moveNodeUp(activeId.value) },
  tree_node_down: async () => { if (activeId.value) await moveNodeDown(activeId.value) },
  tree_node_left: async () => {
    if (!currentNode.value) return
    try { await window.api.moveNode({ id: activeId.value, parentId: null, sortOrder: 0 }); await loadTree() } catch (e) { console.error(e) }
  },
  tree_node_right: async () => {
    if (!currentNode.value) return
    statusMessage.value = '请拖拽到目标节点'
  },
  tree_node_new_father: async () => {
    statusMessage.value = '请拖拽到目标父节点'
  },
  tree_sibl_sort_asc: async () => { if (activeId.value) await sortChildren(activeId.value) },
  tree_sibl_sort_desc: async () => { if (activeId.value) await sortChildren(activeId.value) },
  tree_all_sort_asc: async () => { try { await window.api.sortTree(); await loadTree() } catch (e) { console.error(e) } },
  tree_all_sort_desc: async () => { try { await window.api.sortTree(); await loadTree() } catch (e) { console.error(e) } },
  tree_node_del: async () => {
    if (!currentNode.value) return
    if (confirm('确定删除节点 "' + currentNode.value.name + '" 及其所有子节点?')) await deleteNode(activeId.value)
  },

  // --- 搜索 ---
  select_node: () => { treeSearchKw.value = ''; doTreeSearch() },
  find_in_node_names: () => { treeSearchKw.value = ''; statusMessage.value = '请在左侧搜索框输入' },
  find_in_node: () => { dispatchEditor('find_in_node') },
  find_in_allnodes: () => { showSearchDialog.value = true },
  find_iter_fw: () => { dispatchEditor('find_iter_fw') },
  find_iter_bw: () => { dispatchEditor('find_iter_bw') },
  replace_in_node: () => { dispatchEditor('replace_in_node') },
  replace_in_allnodes: async () => {
    const find = prompt('查找:')
    if (!find) return
    const replace = prompt('替换为:')
    try { const r = await window.api.replaceAllNodes({ find, replace }); statusMessage.value = `已替换 ${r.count} 处`; await reloadAll() } catch (e) { console.error(e) }
  },
  replace_iter_fw: () => { dispatchEditor('replace_iter_fw') },

  // --- 查看 ---
  toggle_show_tree: () => { showTree.value = !showTree.value },
  toggle_show_treelines: () => { document.body.classList.toggle('lt-no-treelines') },
  toggle_show_menubar: () => { statusMessage.value = '菜单栏切换' },
  toggle_show_toolbar: () => { showToolbar.value = !showToolbar.value; document.body.classList.toggle('lt-hide-toolbar') },
  toggle_show_statusbar: () => { showStatusbar.value = !showStatusbar.value },
  toggle_show_node_name_head: () => { showNodeNameHead.value = !showNodeNameHead.value },
  toggle_fullscreen: () => { try { window.electronAPI?.toggleFullscreen?.() } catch {}; statusMessage.value = '全屏切换' },
  toggle_always_on_top: () => { statusMessage.value = '总在最前' },
  toggle_focus_tree_text: () => { statusMessage.value = '焦点切换' },
  toolbar_icons_size_p: () => { document.body.style.setProperty('--lt-toolbar-size', '20px') },
  toolbar_icons_size_m: () => { document.body.style.setProperty('--lt-toolbar-size', '14px') },
  zoom_in: () => { try { const cur = parseFloat(document.body.style.fontSize || '14px'); document.body.style.fontSize = (cur + 1) + 'px' } catch {} },
  zoom_out: () => { try { const cur = parseFloat(document.body.style.fontSize || '14px'); document.body.style.fontSize = Math.max(8, cur - 1) + 'px' } catch {} },

  // --- 帮助 ---
  ct_check_newer: () => { statusMessage.value = '检查更新: 当前为最新版本' },
  ct_homepage: () => { statusMessage.value = '主页: https://github.com/huanggshou/LimeTree' },
  ct_github: () => { statusMessage.value = 'GitHub: https://github.com/huanggshou/LimeTree' },
  ct_issues: () => { statusMessage.value = '问题反馈: https://github.com/huanggshou/LimeTree/issues' },
  ct_help: () => { statusMessage.value = '帮助: LimeTree - 树形笔记应用' },
  ct_about: () => {
    alert('LimeTree v2.1.0\n\n基于 Electron + Vue3 + TipTap\n功能对齐 CherryTree\n\n作者: huanggshou')
  },

  // --- 节点信息/更改 ID ---
  tree_node_info: async () => {
    if (!activeId.value) return
    try { nodeInfoData.value = await window.api.nodeInfo(activeId.value); showNodeInfoDialog.value = true } catch (e) { console.error(e) }
  },
  change_node_id: () => {
    if (!currentNode.value) return
    newNodeId.value = activeId.value
    showChangeIdDialog.value = true
  },
}

// 编辑器相关 action 集合
const editorActions = new Set([
  'act_undo','act_redo','cut_plain','copy_plain','paste_plain',
  'cut_row','copy_row','dup_row','mv_up_row','mv_down_row','del_row',
  'table_column_add','table_column_delete','table_row_add','table_row_delete',
  'table_delete','table_edit_properties','table_column_left','table_column_right',
  'table_column_increase_width','table_column_decrease_width','table_row_up','table_row_down',
  'codebox_change_properties','codebox_increase_width','codebox_decrease_width',
  'codebox_increase_height','codebox_decrease_height',
  'handle_image','handle_table','handle_codebox','handle_embfile',
  'handle_link','handle_anchor','insert_toc','insert_timestamp',
  'insert_special_char','insert_horiz_rule','handle_bull_list','handle_num_list','handle_todo_list',
  'fmt_clone','fmt_latest','fmt_rm','fmt_color_fg','fmt_color_bg',
  'fmt_bold','fmt_italic','fmt_underline','fmt_strikethrough','fmt_monospace',
  'fmt_small','fmt_subscript','fmt_superscript','fmt_h1','fmt_h2','fmt_h3','fmt_h4','fmt_h5','fmt_h6',
  'case_down','case_up','case_tggl','fmt_indent','fmt_unindent',
  'head_expand','head_collapse',
  'fmt_justify_left','fmt_justify_center','fmt_justify_right','fmt_justify_fill',
  'spellcheck_toggle','exec_code_los','exec_code_all','strip_trail_spaces','repl_tabs_spaces',
  'command_palette',
])

function dispatchEditor(action) {
  if (editorRef.value && editorRef.value.onEditorMenu) {
    editorRef.value.onEditorMenu(action)
  }
}

function handleMenu(action) {
  try {
    // 先检查 App 级 action
    if (appActions[action]) {
      appActions[action]()
      return
    }
    // 再检查编辑器 action
    if (editorActions.has(action)) {
      dispatchEditor(action)
      return
    }
    // 未识别的 action 静默忽略
  } catch (err) {
    console.error('handleMenu error:', action, err)
  }
}

// ====== 节点导航 ======
function navigateNode(dir) {
  const sorted = []
  function walk(nodes) {
    for (const n of nodes) {
      sorted.push(n)
      const kids = allNodes.value.filter((x) => x.parent_id === n.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      if (expandedSet.value.has(n.id)) walk(kids)
    }
  }
  walk(rootNodes.value)
  const idx = sorted.findIndex((n) => n.id === activeId.value)
  if (idx === -1) return
  const next = dir > 0 ? Math.min(sorted.length - 1, idx + 1) : Math.max(0, idx - 1)
  onSelectNode(sorted[next])
}

// ====== 重新加载 ======
async function reloadAll() {
  await loadTree()
  await loadBookmarks()
  if (activeId.value) {
    const n = allNodes.value.find((x) => x.id === activeId.value)
    if (n) onSelectNode(n)
  }
}

// ====== 全局点击关闭右键菜单 ======
function onGlobalClick() {
  showTreeMenu.value = false
}

// ====== 生命周期 ======
let offMenuAction = null
let offReload = null

onMounted(async () => {
  // === 关键: onMenuAction 必须最先注册 ===
  try {
    offMenuAction = window.api.onMenuAction((action) => {
      handleMenu(action)
    })
  } catch (e) {
    console.error('onMenuAction registration error:', e)
  }

  try {
    offReload = window.api.onReload(async () => {
      await reloadAll()
    })
  } catch (e) {
    console.error('onReload registration error:', e)
  }

  document.addEventListener('click', onGlobalClick)

  // === 异步加载 ===
  await loadTree()
  await loadBookmarks()

  // 选中第一个节点
  if (rootNodes.value.length > 0) {
    await onSelectNode(rootNodes.value[0])
    expandedSet.value.add(rootNodes.value[0].id)
    expandedSet.value = new Set(expandedSet.value)
  }

  statusMessage.value = '就绪'
})

onBeforeUnmount(() => {
  if (offMenuAction) { try { offMenuAction() } catch {} }
  if (offReload) { try { offReload() } catch {} }
  document.removeEventListener('click', onGlobalClick)
})
</script>
