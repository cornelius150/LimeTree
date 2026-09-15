<template>
  <div class="lt-editor-container">
    <!-- ===== 工具栏 ===== -->
    <div class="lt-toolbar">
      <!-- 组1: 节点导航 -->
      <button class="lt-tb-btn" title="添加节点" @click="$emit('editor-menu', 'tree_add_node')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 3h12v10H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 7h6M5 9h4" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="6" r="2.5" fill="#5b9bd5"/><path d="M12 4.5v3M10.5 6h3" stroke="#fff" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="添加子节点" @click="$emit('editor-menu', 'tree_add_subnode')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 3h8v3H2zM5 7h8v6H5z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="6" r="2.5" fill="#5b9bd5"/><path d="M12 4.5v3M10.5 6h3" stroke="#fff" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="上一个节点" @click="$emit('editor-menu', 'go_node_prev')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M10 4L5 8l5 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="lt-tb-btn" title="下一个节点" @click="$emit('editor-menu', 'go_node_next')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M6 4l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 组2: 文件操作 -->
      <button class="lt-tb-btn" title="打开文件夹" @click="$emit('editor-menu', 'ct_open_folder')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M1 4h5l1 1h7v8H1z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <button class="lt-tb-btn" title="保存" @click="$emit('editor-menu', 'ct_save')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 2h8l2 2v10H3z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 2v4h5V2M5 9h6v4H5z" fill="none" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="导出PDF" @click="$emit('editor-menu', 'export_pdf')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 1h7l3 3v11H3z" fill="none" stroke="currentColor" stroke-width="1.2"/><text x="8" y="11" text-anchor="middle" font-size="5" fill="currentColor">PDF</text></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 组3: 搜索 -->
      <button class="lt-tb-btn" title="在所有节点中查找" @click="$emit('editor-menu', 'find_in_allnodes')"><svg viewBox="0 0 16 16" width="16" height="16"><circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 组4: 列表缩进 -->
      <button class="lt-tb-btn" title="项目符号列表" @click="$emit('editor-menu', 'handle_bull_list')"><svg viewBox="0 0 16 16" width="16" height="16"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="编号列表" @click="$emit('editor-menu', 'handle_num_list')"><svg viewBox="0 0 16 16" width="16" height="16"><text x="1" y="5" font-size="4" fill="currentColor">1.</text><text x="1" y="9" font-size="4" fill="currentColor">2.</text><text x="1" y="13" font-size="4" fill="currentColor">3.</text><path d="M5 4h9M5 8h9M5 12h9" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="待办列表" @click="$emit('editor-menu', 'handle_todo_list')"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M1.5 4L2.5 5L4 3" fill="none" stroke="currentColor" stroke-width="1"/><rect x="1" y="7" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1"/><rect x="1" y="12" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M7 4h8M7 9h8M7 14h8" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="增加缩进" @click="$emit('editor-menu', 'fmt_indent')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M6 4l3 4-3 4M2 4h12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <button class="lt-tb-btn" title="减少缩进" @click="$emit('editor-menu', 'fmt_unindent')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M9 4l-3 4 3 4M2 4h12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 组5: 插入元素 -->
      <button class="lt-tb-btn" title="插入图片" @click="$emit('editor-menu', 'handle_image')"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><path d="M2 12l4-4 3 3 2-2 3 3" fill="none" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="插入表格" @click="$emit('editor-menu', 'handle_table')"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M1 6h14M1 10h14M5 2v12M10 2v12" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="插入代码框" @click="$emit('editor-menu', 'handle_codebox')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M6 5L3 8l3 3M10 5l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1"/></svg></button>
      <button class="lt-tb-btn" title="插入链接" @click="$emit('editor-menu', 'handle_link')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M6 10l4-4M5 7l-2 2a2 2 0 003 3l2-2M11 9l2-2a2 2 0 00-3-3l-2 2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <button class="lt-tb-btn" title="插入锚点" @click="$emit('editor-menu', 'handle_anchor')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 2v12M5 5h6M4 10a4 4 0 008 0" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 组6: 格式化 -->
      <button class="lt-tb-btn" title="克隆格式" @click="$emit('editor-menu', 'fmt_clone')"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7 7h7v7H7z" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/></svg></button>
      <button class="lt-tb-btn" title="应用最近格式" @click="$emit('editor-menu', 'fmt_latest')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 3v10M6 3v10M3 3h6" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="lt-tb-btn" title="清除格式" @click="$emit('editor-menu', 'fmt_rm')"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 4l8 8M4 12L12 4" stroke="currentColor" stroke-width="1.5"/></svg></button>

      <button class="lt-tb-btn" title="文字颜色" @click.stop="toggleFgColorPanel">
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 2L5 12h2l1-3h2l1 3h2L8 2zm0 5l.5 2h-1L8 7z" fill="currentColor"/><rect x="2" y="13" width="12" height="2" fill="#e74c3c"/></svg>
      </button>
      <button class="lt-tb-btn" title="背景色" @click.stop="toggleBgColorPanel">
        <svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="4" y="4" width="8" height="8" fill="#f39c12"/><text x="8" y="11" text-anchor="middle" font-size="6" fill="currentColor">A</text></svg>
      </button>

      <button class="lt-tb-btn" title="加粗" @click="$emit('editor-menu', 'fmt_bold')"><strong style="font-size:14px">B</strong></button>
      <button class="lt-tb-btn lt-tb-italic" title="斜体" @click="$emit('editor-menu', 'fmt_italic')"><em style="font-size:14px">I</em></button>
      <button class="lt-tb-btn" title="下划线" @click="$emit('editor-menu', 'fmt_underline')"><span style="text-decoration:underline;font-size:14px">U</span></button>
      <button class="lt-tb-btn" title="删除线" @click="$emit('editor-menu', 'fmt_strikethrough')"><span style="text-decoration:line-through;font-size:14px">S</span></button>
      <button class="lt-tb-btn" title="标题1" @click="$emit('editor-menu', 'fmt_h1')" style="font-size:11px;font-weight:bold">H1</button>
      <button class="lt-tb-btn" title="标题2" @click="$emit('editor-menu', 'fmt_h2')" style="font-size:11px;font-weight:bold">H2</button>
      <button class="lt-tb-btn" title="标题3" @click="$emit('editor-menu', 'fmt_h3')" style="font-size:11px;font-weight:bold">H3</button>
      <button class="lt-tb-btn" title="小号字" @click="$emit('editor-menu', 'fmt_small')" style="font-size:10px">S</button>
      <button class="lt-tb-btn" title="下标" @click="$emit('editor-menu', 'fmt_subscript')">X<sub style="font-size:8px">2</sub></button>
      <button class="lt-tb-btn" title="上标" @click="$emit('editor-menu', 'fmt_superscript')">X<sup style="font-size:8px">2</sup></button>
      <button class="lt-tb-btn" title="等宽字体" @click="$emit('editor-menu', 'fmt_monospace')" style="font-family:monospace;font-size:12px">M</button>
      <span class="lt-tb-sep"></span>

      <!-- 字体/字号下拉 -->
      <select class="lt-tb-select" title="字体" @change="applyFontFamily($event.target.value)" v-model="selectedFont">
        <option v-for="f in fontList" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
      </select>
      <select class="lt-tb-select lt-tb-fontsize" title="字号" @change="applyFontSize($event.target.value)" v-model="selectedSize">
        <option v-for="s in sizeList" :key="s" :value="s">{{ s }}pt</option>
      </select>
      <span class="lt-tb-sep"></span>

      <!-- 段落缩进 -->
      <button class="lt-tb-btn" title="段落增加缩进" @click="applyParagraphIndent(1)"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 4h12M2 8h12M2 12h12M6 3v10" stroke="currentColor" stroke-width="1"/><path d="M6 6l2 2-2 2" fill="currentColor"/></svg></button>
      <button class="lt-tb-btn" title="段落减少缩进" @click="applyParagraphIndent(-1)"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 4h12M2 8h12M2 12h12M6 3v10" stroke="currentColor" stroke-width="1"/><path d="M8 6L6 8l2 2" fill="currentColor"/></svg></button>
      <span class="lt-tb-sep"></span>

      <!-- 时间戳 -->
      <button class="lt-tb-btn" title="插入时间戳" @click="$emit('editor-menu', 'insert_timestamp')"><svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.2"/></svg></button>
    </div>

    <!-- 颜色面板 -->
    <div v-if="showFgColorPanel" class="lt-color-panel" @click.stop>
      <div class="lt-color-panel-title">文字颜色</div>
      <div class="lt-color-grid">
        <div v-for="c in fgColors" :key="c" class="lt-color-cell" :style="{ background: c }" @click.stop="applyFgColor(c)"></div>
      </div>
      <button class="lt-color-reset" @click.stop="applyFgColor('')">清除颜色</button>
    </div>
    <div v-if="showBgColorPanel" class="lt-color-panel" @click.stop>
      <div class="lt-color-panel-title">背景颜色</div>
      <div class="lt-color-grid">
        <div v-for="c in bgColors" :key="c" class="lt-color-cell" :style="{ background: c }" @click.stop="applyBgColor(c)"></div>
      </div>
      <button class="lt-color-reset" @click.stop="applyBgColor('')">清除背景</button>
    </div>

    <!-- 查找替换条 -->
    <div v-if="showFindBar" class="lt-find-bar">
      <input ref="findInput" v-model="findText" class="lt-find-input" placeholder="查找..." @keydown.enter="doFindNext" @keydown.escape="showFindBar=false" />
      <button class="lt-find-btn" @click="doFindNext">下一个</button>
      <button class="lt-find-btn" @click="doFindPrev">上一个</button>
      <input v-model="replaceText" class="lt-find-input" placeholder="替换..." />
      <button class="lt-find-btn" @click="doReplace">替换</button>
      <button class="lt-find-btn" @click="doReplaceAll">全部替换</button>
      <button class="lt-find-btn lt-find-close" @click="showFindBar=false">✕</button>
    </div>

    <!-- 编辑器 -->
    <div class="lt-editor-area" @contextmenu.prevent="onEditorContextMenu">
      <editor-content :editor="editor" class="lt-prose" />
    </div>

    <!-- 右键菜单 -->
    <div v-if="showContextMenu" class="lt-context-menu" :style="{ left: ctxMenuX + 'px', top: ctxMenuY + 'px' }" @click.stop>
      <div class="lt-ctx-item" @click.stop="doAction('cut_plain')">剪切</div>
      <div class="lt-ctx-item" @click.stop="doAction('copy_plain')">复制</div>
      <div class="lt-ctx-item" @click.stop="doAction('paste_plain')">粘贴</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="doAction('paste_plain')">粘贴纯文本</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="doAction('cut_row')">剪切行</div>
      <div class="lt-ctx-item" @click.stop="doAction('copy_row')">复制行</div>
      <div class="lt-ctx-item" @click.stop="doAction('dup_row')">重复行</div>
      <div class="lt-ctx-item" @click.stop="doAction('del_row')">删除行</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="doAction('fmt_bold')">加粗</div>
      <div class="lt-ctx-item" @click.stop="doAction('fmt_italic')">斜体</div>
      <div class="lt-ctx-item" @click.stop="doAction('fmt_underline')">下划线</div>
      <div class="lt-ctx-item" @click.stop="doAction('fmt_strikethrough')">删除线</div>
      <div class="lt-ctx-sep"></div>
      <div class="lt-ctx-item" @click.stop="doAction('handle_bull_list')">项目符号</div>
      <div class="lt-ctx-item" @click.stop="doAction('handle_num_list')">编号列表</div>
      <div class="lt-ctx-item" @click.stop="doAction('handle_todo_list')">待办列表</div>
    </div>

    <!-- 代码框插入对话框 -->
    <div v-if="showCodeboxDialog" class="lt-modal-overlay" @click="showCodeboxDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">插入代码框</div>
        <div class="lt-modal-body">
          <label>语言:
            <select v-model="codeboxLang" class="lt-modal-select">
              <option>text</option><option>javascript</option><option>python</option><option>java</option>
              <option>c</option><option>cpp</option><option>csharp</option><option>go</option>
              <option>rust</option><option>ruby</option><option>php</option><option>html</option>
              <option>css</option><option>sql</option><option>json</option><option>bash</option>
              <option>yaml</option><option>xml</option><option>markdown</option>
            </select>
          </label>
          <label>初始高度:
            <input type="number" v-model.number="codeboxHeight" min="80" max="1000" class="lt-modal-input" />
          </label>
          <label class="lt-modal-check">
            <input type="checkbox" v-model="codeboxLineNumbers" /> 显示行号
          </label>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showCodeboxDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="confirmCodebox">确定</button>
        </div>
      </div>
    </div>

    <!-- 表格插入对话框 -->
    <div v-if="showTableDialog" class="lt-modal-overlay" @click="showTableDialog=false">
      <div class="lt-modal" @click.stop>
        <div class="lt-modal-title">插入表格</div>
        <div class="lt-modal-body">
          <label>行数: <input type="number" v-model.number="tableRows" min="1" max="50" class="lt-modal-input" /></label>
          <label>列数: <input type="number" v-model.number="tableCols" min="1" max="20" class="lt-modal-input" /></label>
          <label class="lt-modal-check"><input type="checkbox" v-model="tableHeader" /> 包含表头</label>
        </div>
        <div class="lt-modal-footer">
          <button class="lt-modal-btn" @click="showTableDialog=false">取消</button>
          <button class="lt-modal-btn lt-modal-btn-primary" @click="confirmTable">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Markdown } from 'tiptap-markdown'
import { ResizableImage } from '../extensions/resizable-image.js'
import { ResizableCodeBlock } from '../extensions/resizable-code-block.js'

const props = defineProps({
  content: { type: String, default: '' },
})
const emit = defineEmits(['editor-menu', 'save-content'])

// --- 字体/字号 ---
const fontList = [
  'Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi', 'FangSong', 'Microsoft YaHei UI',
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Tahoma',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino Linotype', 'Consolas',
  'Lucida Console', 'Segoe UI',
]
const sizeList = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32]
const selectedFont = ref('Microsoft YaHei')
const selectedSize = ref(14)

// --- 颜色面板 ---
const fgColors = [
  '#000000','#333333','#666666','#999999','#cccccc','#ffffff','#ff0000','#cc0000',
  '#990000','#ff6600','#ff9900','#ffcc00','#ffff00','#99cc00','#33cc00','#009900',
  '#006633','#00cccc','#0099cc','#0066ff','#0000ff','#000099','#330099','#660099',
  '#9900cc','#cc00cc','#ff00ff','#cc66cc',
]
const bgColors = [
  'transparent','#ffffff','#f5f5f5','#e8e8e8','#d0d0d0','#fff8dc','#ffefd5','#ffe4b5',
  '#ffe4c4','#ffdab9','#ffc0cb','#ffb6c1','#ff9999','#ff6b6b','#ffcc00','#ffff00',
  '#90ee90','#98fb98','#00fa9a','#87ceeb','#87cefa','#add8e6','#b0c4de','#dda0dd',
]
const showFgColorPanel = ref(false)
const showBgColorPanel = ref(false)

// --- 查找替换 ---
const showFindBar = ref(false)
const findText = ref('')
const replaceText = ref('')
const findInput = ref(null)

// --- 右键菜单 ---
const showContextMenu = ref(false)
const ctxMenuX = ref(0)
const ctxMenuY = ref(0)

// --- 对话框 ---
const showCodeboxDialog = ref(false)
const codeboxLang = ref('text')
const codeboxHeight = ref(200)
const codeboxLineNumbers = ref(false)
const showTableDialog = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const tableHeader = ref(true)

// --- TipTap 编辑器 ---
const editor = useEditor({
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Underline,
    Color,
    TextStyle,
    Highlight,
    Link.configure({ openOnClick: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Markdown,
    ResizableImage,
    ResizableCodeBlock,
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'lt-prose-content',
    },
  },
  onUpdate: () => {
    emitSave()
  },
})

let saveTimer = null
function emitSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (editor.value) {
      let md = ''
      try { md = editor.value.storage.markdown.getMarkdown() } catch { md = editor.value.getHTML() }
      emit('save-content', md)
    }
  }, 500)
}

// --- 加载内容 ---
watch(() => props.content, (val) => {
  if (!editor.value) return
  if (val !== undefined && val !== null) {
    const current = (() => { try { return editor.value.storage.markdown.getMarkdown() } catch { return editor.value.getHTML() } })()
    if (val !== current) {
      try { editor.value.commands.setContent(val, false) } catch (e) { console.error('setContent error:', e) }
    }
  }
}, { immediate: true })

// --- 图片粘贴 ---
window.__ltPasteImg = (dataUrl) => {
  if (!editor.value) return
  try {
    editor.value.chain().focus().setResizableImage({ src: dataUrl }).run()
  } catch (e) { console.error('paste image error:', e) }
}

// --- 全局点击关闭 ---
function onGlobalClick() {
  showFgColorPanel.value = false
  showBgColorPanel.value = false
  showContextMenu.value = false
}

// --- 颜色面板开关 ---
function toggleFgColorPanel() {
  showBgColorPanel.value = false
  showFgColorPanel.value = !showFgColorPanel.value
}
function toggleBgColorPanel() {
  showFgColorPanel.value = false
  showBgColorPanel.value = !showBgColorPanel.value
}

// --- 编辑器右键菜单 ---
function onEditorContextMenu(e) {
  ctxMenuX.value = e.clientX
  ctxMenuY.value = e.clientY
  showContextMenu.value = true
}

// --- 字体/字号 ---
function applyFontFamily(font) {
  if (!editor.value) return
  try { editor.value.chain().focus().setMark('textStyle', { fontFamily: font }).run() } catch (e) { console.error(e) }
}
function applyFontSize(size) {
  if (!editor.value) return
  try { editor.value.chain().focus().setMark('textStyle', { fontSize: size + 'pt' }).run() } catch (e) { console.error(e) }
}

// --- 段落缩进 ---
function applyParagraphIndent(dir) {
  if (!editor.value) return
  try {
    if (dir > 0) {
      editor.value.chain().focus().sinkListItem('listItem').run()
    } else {
      editor.value.chain().focus().liftListItem('listItem').run()
    }
  } catch (e) {
    // 回退方案：用 padding
    try {
      const sel = window.getSelection()
      if (sel.rangeCount) {
        document.execCommand('indent' )
      }
    } catch {}
  }
}

// --- 颜色应用 ---
function applyFgColor(color) {
  if (!editor.value) return
  try {
    if (color) editor.value.chain().focus().setColor(color).run()
    else editor.value.chain().focus().unsetColor().run()
  } catch (e) { console.error(e) }
  showFgColorPanel.value = false
}
function applyBgColor(color) {
  if (!editor.value) return
  try {
    if (color && color !== 'transparent') editor.value.chain().focus().toggleHighlight({ color }).run()
    else editor.value.chain().focus().unsetHighlight().run()
  } catch (e) { console.error(e) }
  showBgColorPanel.value = false
}

// --- 查找替换 ---
function doFindNext() {
  if (!editor.value || !findText.value) return
  try {
    const found = window.find(findText.value, false, false, true, false, false, false)
    if (!found) {
      // 回到开头
      const el = editor.value.view.dom
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      window.find(findText.value, false, false, true, false, false, false)
    }
  } catch (e) { console.error(e) }
}
function doFindPrev() {
  if (!editor.value || !findText.value) return
  try { window.find(findText.value, false, true, true, false, false, false) } catch (e) { console.error(e) }
}
function doReplace() {
  if (!editor.value || !findText.value) return
  try {
    const sel = window.getSelection()
    if (sel.toString() === findText.value) {
      document.execCommand('insertText', false, replaceText.value)
    }
    doFindNext()
  } catch (e) { console.error(e) }
}
function doReplaceAll() {
  if (!editor.value || !findText.value) return
  try {
    let html = editor.value.getHTML()
    // 只在文本节点中替换（简单实现）
    const re = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    html = html.replace(re, replaceText.value)
    editor.value.chain().focus().setContent(html, false).run()
  } catch (e) { console.error(e) }
}

// --- 右键菜单动作 ---
function doAction(action) {
  showContextMenu.value = false
  onEditorMenu(action)
}

// --- 确认对话框 ---
function confirmCodebox() {
  if (!editor.value) return
  try {
    editor.value.chain().focus().insertResizableCodeBlock({
      language: codeboxLang.value,
      height: codeboxHeight.value,
      showLineNumbers: codeboxLineNumbers.value,
      code: '',
    }).run()
  } catch (e) { console.error('insert codebox error:', e) }
  showCodeboxDialog.value = false
}

function confirmTable() {
  if (!editor.value) return
  try {
    editor.value.chain().focus().insertTable({
      rows: tableRows.value,
      cols: tableCols.value,
      withHeaderRow: tableHeader.value,
    }).run()
  } catch (e) { console.error('insert table error:', e) }
  showTableDialog.value = false
}

// --- onEditorMenu: 处理所有编辑器相关 action ---
function onEditorMenu(action) {
  if (!editor.value) return
  try {
    switch (action) {
      // --- 编辑 ---
      case 'act_undo':
        try { editor.value.chain().focus().undo().run() } catch {}
        break
      case 'act_redo':
        try { editor.value.chain().focus().redo().run() } catch {}
        break
      case 'cut_plain':
        try { document.execCommand('cut') } catch {}
        break
      case 'copy_plain':
        try { document.execCommand('copy') } catch {}
        break
      case 'paste_plain':
        try { navigator.clipboard.readText().then(t => editor.value.chain().focus().insertContent(t).run()) } catch {}
        break

      // --- 行操作 ---
      case 'cut_row':
        try { editor.value.chain().focus().selectParentNode().deleteSelection().run() } catch {}
        break
      case 'copy_row':
        try { document.execCommand('copy') } catch {}
        break
      case 'dup_row':
        try {
          const sel = window.getSelection()
          if (sel.rangeCount) {
            const range = sel.getRangeAt(0)
            const clone = range.cloneContents()
            const div = document.createElement('div')
            div.appendChild(clone)
            editor.value.chain().focus().insertContent(div.innerHTML).run()
          }
        } catch {}
        break
      case 'del_row':
        try { editor.value.chain().focus().selectParentNode().deleteSelection().run() } catch {}
        break

      // --- 表格 ---
      case 'handle_table':
        showTableDialog.value = true
        break
      case 'table_column_add':
        try { editor.value.chain().focus().addColumnAfter().run() } catch {}
        break
      case 'table_column_delete':
        try { editor.value.chain().focus().deleteColumn().run() } catch {}
        break
      case 'table_row_add':
        try { editor.value.chain().focus().addRowAfter().run() } catch {}
        break
      case 'table_row_delete':
        try { editor.value.chain().focus().deleteRow().run() } catch {}
        break
      case 'table_delete':
        try { editor.value.chain().focus().deleteTable().run() } catch {}
        break
      case 'table_edit_properties':
        // 切换表头
        try { editor.value.chain().focus().toggleHeaderRow().run() } catch {}
        break

      // --- 代码框 ---
      case 'handle_codebox':
        showCodeboxDialog.value = true
        break
      case 'codebox_change_properties':
        // 选中代码框后弹出对话框
        showCodeboxDialog.value = true
        break
      case 'codebox_increase_width':
        try { editor.value.chain().focus().updateAttributes('resizableCodeBlock', { height: (editor.value.getAttributes('resizableCodeBlock').height || 200) + 20 }).run() } catch {}
        break
      case 'codebox_decrease_width':
        try { editor.value.chain().focus().updateAttributes('resizableCodeBlock', { height: Math.max(80, (editor.value.getAttributes('resizableCodeBlock').height || 200) - 20) }).run() } catch {}
        break
      case 'codebox_increase_height':
        try { editor.value.chain().focus().updateAttributes('resizableCodeBlock', { height: (editor.value.getAttributes('resizableCodeBlock').height || 200) + 30 }).run() } catch {}
        break
      case 'codebox_decrease_height':
        try { editor.value.chain().focus().updateAttributes('resizableCodeBlock', { height: Math.max(80, (editor.value.getAttributes('resizableCodeBlock').height || 200) - 30) }).run() } catch {}
        break

      // --- 插入 ---
      case 'handle_image':
        if (window.api && window.api.selectImage) {
          window.api.selectImage().then((r) => {
            if (r && r.dataUrl) {
              try { editor.value.chain().focus().setResizableImage({ src: r.dataUrl, alt: r.name || '' }).run() } catch (e) { console.error(e) }
            }
          }).catch(() => {})
        }
        break
      case 'handle_link':
        try {
          const url = prompt('输入链接 URL:')
          if (url) editor.value.chain().focus().setLink({ href: url }).run()
        } catch {}
        break
      case 'handle_anchor':
        try {
          const anchor = prompt('输入锚点名称:')
          if (anchor) editor.value.chain().focus().setLink({ href: '#' + anchor }).run()
        } catch {}
        break
      case 'insert_toc':
        try { editor.value.chain().focus().insertContent('<p style="color:#999">[目录]</p>').run() } catch {}
        break
      case 'insert_timestamp':
        try {
          const ts = new Date().toLocaleString('zh-CN', { hour12: false })
          editor.value.chain().focus().insertContent(ts).run()
        } catch {}
        break
      case 'insert_special_char':
        try {
          const ch = prompt('输入特殊字符:')
          if (ch) editor.value.chain().focus().insertContent(ch).run()
        } catch {}
        break
      case 'insert_horiz_rule':
        try { editor.value.chain().focus().setHorizontalRule().run() } catch {}
        break
      case 'handle_bull_list':
        try { editor.value.chain().focus().toggleBulletList().run() } catch {}
        break
      case 'handle_num_list':
        try { editor.value.chain().focus().toggleOrderedList().run() } catch {}
        break
      case 'handle_todo_list':
        try { editor.value.chain().focus().toggleTaskList().run() } catch {}
        break

      // --- 格式化 ---
      case 'fmt_clone':
        // 克隆格式（简化版：复制当前 marks）
        try {} catch {}
        break
      case 'fmt_latest':
        try {} catch {}
        break
      case 'fmt_rm':
        try { editor.value.chain().focus().unsetAllMarks().clearNodes().run() } catch {}
        break
      case 'fmt_color_fg':
        showFgColorPanel.value = !showFgColorPanel.value
        showBgColorPanel.value = false
        break
      case 'fmt_color_bg':
        showBgColorPanel.value = !showBgColorPanel.value
        showFgColorPanel.value = false
        break
      case 'fmt_bold':
        try { editor.value.chain().focus().toggleBold().run() } catch {}
        break
      case 'fmt_italic':
        try { editor.value.chain().focus().toggleItalic().run() } catch {}
        break
      case 'fmt_underline':
        try { editor.value.chain().focus().toggleUnderline().run() } catch {}
        break
      case 'fmt_strikethrough':
        try { editor.value.chain().focus().toggleStrike().run() } catch {}
        break
      case 'fmt_monospace':
        try { editor.value.chain().focus().toggleCode().run() } catch {}
        break
      case 'fmt_small':
        try { editor.value.chain().focus().setMark('textStyle', { fontSize: '10pt' }).run() } catch {}
        break
      case 'fmt_subscript':
        try {
          // 用 <sub> 标签实现
          editor.value.chain().focus().insertContent('<sub>').run()
        } catch {}
        break
      case 'fmt_superscript':
        try {
          // 用 <sup> 标签实现
          editor.value.chain().focus().insertContent('<sup>').run()
        } catch {}
        break
      case 'fmt_h1':
        try { editor.value.chain().focus().toggleHeading({ level: 1 }).run() } catch {}
        break
      case 'fmt_h2':
        try { editor.value.chain().focus().toggleHeading({ level: 2 }).run() } catch {}
        break
      case 'fmt_h3':
        try { editor.value.chain().focus().toggleHeading({ level: 3 }).run() } catch {}
        break
      case 'fmt_h4':
        try { editor.value.chain().focus().toggleHeading({ level: 4 }).run() } catch {}
        break
      case 'fmt_h5':
        try { editor.value.chain().focus().toggleHeading({ level: 5 }).run() } catch {}
        break
      case 'fmt_h6':
        try { editor.value.chain().focus().toggleHeading({ level: 6 }).run() } catch {}
        break
      case 'fmt_indent':
        try { editor.value.chain().focus().sinkListItem('listItem').run() } catch { try { document.execCommand('indent') } catch {} }
        break
      case 'fmt_unindent':
        try { editor.value.chain().focus().liftListItem('listItem').run() } catch { try { document.execCommand('outdent') } catch {} }
        break
      case 'fmt_justify_left':
        try { editor.value.chain().focus().setTextAlign('left').run() } catch {}
        break
      case 'fmt_justify_center':
        try { editor.value.chain().focus().setTextAlign('center').run() } catch {}
        break
      case 'fmt_justify_right':
        try { editor.value.chain().focus().setTextAlign('right').run() } catch {}
        break
      case 'fmt_justify_fill':
        try { editor.value.chain().focus().setTextAlign('justify').run() } catch {}
        break

      // --- 大小写 ---
      case 'case_down':
        try { replaceSelection(editor.value, (t) => t.toLowerCase()) } catch {}
        break
      case 'case_up':
        try { replaceSelection(editor.value, (t) => t.toUpperCase()) } catch {}
        break
      case 'case_tggl':
        try { replaceSelection(editor.value, (t) => t === t.toUpperCase() ? t.toLowerCase() : t.toUpperCase()) } catch {}
        break

      // --- 查找替换 ---
      case 'find_in_node':
        showFindBar.value = true
        nextTick(() => { if (findInput.value) findInput.value.focus() })
        break
      case 'find_iter_fw':
        doFindNext()
        break
      case 'find_iter_bw':
        doFindPrev()
        break
      case 'replace_in_node':
        showFindBar.value = true
        nextTick(() => { if (findInput.value) findInput.value.focus() })
        break
      case 'replace_iter_fw':
        doReplace()
        break

      // --- 展开/折叠 ---
      case 'head_expand':
        try { editor.value.chain().focus().setHeading({ level: 1 }).run() } catch {}
        break
      case 'head_collapse':
        try { editor.value.chain().focus().setParagraph().run() } catch {}
        break

      // --- 工具 ---
      case 'strip_trail_spaces':
        try {
          let html = editor.value.getHTML()
          html = html.replace(/\s+<(\/?)/g, '<$1')
          editor.value.chain().focus().setContent(html, false).run()
        } catch {}
        break
      case 'repl_tabs_spaces':
        try {
          let html = editor.value.getHTML()
          html = html.replace(/\t/g, '  ')
          editor.value.chain().focus().setContent(html, false).run()
        } catch {}
        break

      default:
        // 未处理的 action 静默忽略
        break
    }
  } catch (err) {
    console.error('onEditorMenu error:', action, err)
  }
}

// --- 辅助：替换选中文本 ---
function replaceSelection(ed, fn) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return
  const text = sel.toString()
  if (!text) return
  document.execCommand('insertText', false, fn(text))
}

// --- 导出函数给父组件 ---
defineExpose({
  onEditorMenu,
  editor,
})

// --- 生命周期 ---
onMounted(() => {
  document.addEventListener('click', onGlobalClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
  if (saveTimer) clearTimeout(saveTimer)
  if (editor.value) {
    try { editor.value.destroy() } catch {}
  }
})
</script>
