<template>
  <div class="editor-area">
    <!-- ============ CherryTree 式工具栏 ============ -->
    <div class="editor-toolbar" v-if="editor && showToolbar">
      <button class="tb-btn" @click="$emit('app-menu', 'menu:new-instance')" title="新建笔记实例">🆕</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:open')" title="打开笔记">📂</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:save')" title="保存笔记">💾</button>
      <button class="tb-btn" @click="exportPdf" title="导出为 PDF">📄</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:print')" title="打印">🖨</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="撤销">↶</button>
      <button class="tb-btn" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="重做">↷</button>
      <button class="tb-btn" @click="openFind" title="查找">🔍</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:add-node')" title="添加节点">➕</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:add-child')" title="添加子节点">🌱</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:node-up')" title="上移节点">⬆</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:node-down')" title="下移节点">⬇</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:expand-all')" title="展开全部节点">⊞</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:collapse-all')" title="折叠全部节点">⊟</button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:node-color')" title="更改节点高亮颜色">🎨</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="pastePlain" title="粘贴为纯文本 (Ctrl+Alt+P)">📋</button>
      <button class="tb-btn" @click="insertTimestamp" title="插入时间戳 (Ctrl+;)">⏰</button>
      <button class="tb-btn" @click="insertImage" title="插入图片（可拖拽缩放）">🖼️</button>
      <button class="tb-btn" @click="insertTable" title="插入表格（可拖拽缩放列宽）">📊</button>
      <button class="tb-btn" @click="insertCodeBlock" title="插入代码框（可拖拽缩放）">📝</button>
      <button class="tb-btn" @click="editor.chain().focus().setHorizontalRule().run()" title="插入水平线">―</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="pickTextColor" title="文本颜色 (Ctrl+Shift+T)">🅰</button>
      <button class="tb-btn" @click="pickBgColor" title="文本背景色 (Ctrl+Shift+H)">🖌</button>
      <button class="tb-btn" :class="{active: editor.isActive('bold')}" @click="editor.chain().focus().toggleBold().run()" title="加粗 (Ctrl+B)"><b>B</b></button>
      <button class="tb-btn" :class="{active: editor.isActive('italic')}" @click="editor.chain().focus().toggleItalic().run()" title="斜体 (Ctrl+I)"><i>I</i></button>
      <button class="tb-btn" :class="{active: editor.isActive('underline')}" @click="editor.chain().focus().toggleUnderline().run()" title="下划线 (Ctrl+U)"><u>U</u></button>
      <button class="tb-btn" :class="{active: editor.isActive('strike')}" @click="editor.chain().focus().toggleStrike().run()" title="删除线 (Ctrl+K)"><s>S</s></button>
      <span class="tb-sep"></span>
      <button class="tb-btn tb-text" @click="setFontSize(11)" title="小号字 (Ctrl+1)">小</button>
      <button class="tb-btn tb-text" @click="setFontSize(14)" title="中号字 (Ctrl+2)">中</button>
      <button class="tb-btn tb-text" @click="setFontSize(18)" title="大号字 (Ctrl+3)">大</button>
      <button class="tb-btn tb-text" @click="setFontSize(26)" title="特大号字 (Ctrl+4)">特大</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" :class="{active: editor.isActive('bulletList')}" @click="editor.chain().focus().toggleBulletList().run()" title="项目符号列表 (Ctrl+Alt+2)">•</button>
      <button class="tb-btn" :class="{active: editor.isActive('orderedList')}" @click="editor.chain().focus().toggleOrderedList().run()" title="编号列表 (Ctrl+Alt+1)">1.</button>
      <button class="tb-btn" :class="{active: isTodoList}" @click="toggleTodoList" title="待办事项列表 (Ctrl+Alt+3)">☑</button>
      <button class="tb-btn" @click="editor.chain().focus().liftListItem('listItem').run()" title="降级列表项 (Ctrl+Alt+-)">⇤</button>
      <button class="tb-btn" @click="editor.chain().focus().sinkListItem('listItem').run()" title="升级列表项 (Ctrl+Alt+=)">⇥</button>
    </div>

    <!-- ============ 查找条 ============ -->
    <div v-if="findBar" class="find-bar">
      <input ref="findInput" v-model="findText" placeholder="查找..." @keyup.enter="findNext(false)" @keyup.esc="findBar = false" />
      <input v-model="replaceText" placeholder="替换为..." @keyup.enter="doReplace" />
      <button class="fb-btn" @click="findNext(false)" title="下一个 (F3)">下一个</button>
      <button class="fb-btn" @click="findNext(true)" title="上一个 (Shift+F3)">上一个</button>
      <button class="fb-btn" @click="doReplace" title="替换当前">替换</button>
      <button class="fb-btn fb-close" @click="findBar = false">✕</button>
    </div>

    <!-- ============ 编辑区 ============ -->
    <div class="editor-content" :class="{ nowrap: !wrapLine, 'show-ln': showLn, 'show-ws': showWs, 'show-le': showLe }" @contextmenu.prevent="showCtxMenu">
      <editor-content :editor="editor" />
    </div>

    <!-- ============ CherryTree 式编辑区右键菜单 ============ -->
    <div v-if="ctxMenuVisible" class="ctx-menu" :style="{ left: ctxX+'px', top: ctxY+'px' }" @click.stop>
      <div class="ctx-item" @click="doCut"><span class="ctx-icon">✂️</span>剪切<span class="ctx-key">Ctrl+X</span></div>
      <div class="ctx-item" @click="doCopy"><span class="ctx-icon">📋</span>复制<span class="ctx-key">Ctrl+C</span></div>
      <div class="ctx-item" @click="doPaste"><span class="ctx-icon">📄</span>粘贴<span class="ctx-key">Ctrl+V</span></div>
      <div class="ctx-item" @click="pastePlain"><span class="ctx-icon">🧾</span>粘贴为纯文本<span class="ctx-key">Ctrl+Alt+P</span></div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="insertTimestamp"><span class="ctx-icon">⏰</span>插入时间戳<span class="ctx-key">Ctrl+;</span></div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="insertImage"><span class="ctx-icon">🖼️</span>插入图片</div>
      <div class="ctx-item" @click="insertTable"><span class="ctx-icon">📊</span>插入表格</div>
      <div class="ctx-item" @click="insertCodeBlock"><span class="ctx-icon">📝</span>插入代码框</div>
      <div class="ctx-item" @click="editor.chain().focus().setHorizontalRule().run()"><span class="ctx-icon">―</span>插入水平线</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="toggleLink"><span class="ctx-icon">🔗</span>插入/编辑链接</div>
      <div class="ctx-item" @click="stripLink"><span class="ctx-icon">⛓️</span>剥离链接</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="editor.chain().focus().toggleBulletList().run()" :class="{active: editor.isActive('bulletList')}"><span class="ctx-icon">•</span>项目符号列表</div>
      <div class="ctx-item" @click="editor.chain().focus().toggleOrderedList().run()" :class="{active: editor.isActive('orderedList')}"><span class="ctx-icon">1.</span>编号列表</div>
      <div class="ctx-item" @click="toggleTodoList" :class="{active: isTodoList}"><span class="ctx-icon">☑</span>待办事项列表</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="editor.chain().focus().undo().run()" :class="{disabled: !editor.can().undo()}"><span class="ctx-icon">↶</span>撤销</div>
      <div class="ctx-item" @click="editor.chain().focus().redo().run()" :class="{disabled: !editor.can().redo()}"><span class="ctx-icon">↷</span>重做</div>
    </div>

    <!-- ============ 插入表格对话框 ============ -->
    <div v-if="tableDlg" class="modal-overlay" @click.self="tableDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">插入表格</div>
        <div class="modal-body">
          <div class="modal-field"><label>行数</label><input type="number" v-model.number="tRows" min="1" max="50" /></div>
          <div class="modal-field"><label>列数</label><input type="number" v-model.number="tCols" min="1" max="20" /></div>
          <div class="modal-field"><label><input type="checkbox" v-model="tHeader" /> 含表头行</label></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="tableDlg = false">取消</button>
          <button class="modal-btn modal-btn-ok" @click="confirmTable">确定</button>
        </div>
      </div>
    </div>

    <!-- ============ 插入代码框对话框 ============ -->
    <div v-if="codeDlg" class="modal-overlay" @click.self="codeDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">插入代码框</div>
        <div class="modal-body">
          <div class="modal-field"><label>编程语言</label>
            <select v-model="codeLang" class="modal-select">
              <option value="">无（纯文本）</option>
              <option value="text">文本</option><option value="bash">Bash</option><option value="c">C</option>
              <option value="cpp">C++</option><option value="csharp">C#</option><option value="css">CSS</option>
              <option value="go">Go</option><option value="html">HTML</option><option value="java">Java</option>
              <option value="javascript">JavaScript</option><option value="json">JSON</option><option value="python">Python</option>
              <option value="ruby">Ruby</option><option value="rust">Rust</option><option value="sql">SQL</option>
              <option value="typescript">TypeScript</option><option value="xml">XML</option><option value="yaml">YAML</option>
            </select>
          </div>
          <div class="modal-field"><label>初始高度</label><input type="number" v-model.number="codeHeight" min="80" max="2000" /></div>
          <div class="modal-field"><label><input type="checkbox" v-model="codeLn" /> 显示行号</label></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="codeDlg = false">取消</button>
          <button class="modal-btn modal-btn-ok" @click="confirmCode">确定</button>
        </div>
      </div>
    </div>

    <!-- ============ 格式化表格对话框 ============ -->
    <div v-if="fmtDlg" class="modal-overlay" @click.self="fmtDlg = false">
      <div class="modal-dialog">
        <div class="modal-title">格式化表格</div>
        <div class="modal-body">
          <div class="modal-field"><label>列宽(px)</label><input type="number" v-model.number="fmtColW" min="40" max="1000" /></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="fmtDlg = false">取消</button>
          <button class="modal-btn modal-btn-ok" @click="confirmFmtTable">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Underline } from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

/* TextStyle 扩展加 fontSize 属性（CherryTree 小/中/大/特大号字） */
const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        parseHTML: el => el.style.fontSize || null
      }
    }
  }
})
import { ResizableImage } from '../extensions/resizable-image.js'
import { ResizableCodeBlock } from '../extensions/resizable-code-block.js'

const props = defineProps({
  node: Object,
  showToolbar: { type: Boolean, default: true },
  wrapLine: { type: Boolean, default: true },
  showLn: { type: Boolean, default: false },
  showWs: { type: Boolean, default: false },
  showLe: { type: Boolean, default: false }
})
const emit = defineEmits(['save', 'app-menu'])

const ctxMenuVisible = ref(false); const ctxX = ref(0); const ctxY = ref(0)
const tableDlg = ref(false); const tRows = ref(3); const tCols = ref(3); const tHeader = ref(true)
const codeDlg = ref(false); const codeLang = ref(''); const codeHeight = ref(200); const codeLn = ref(false)
const fmtDlg = ref(false); const fmtColW = ref(120)
const findBar = ref(false); const findText = ref(''); const replaceText = ref('')
const findInput = ref(null)
const colorPalette = ['#000000', '#ffffff', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  '#808080', '#c0c0c0', '#ffcccc', '#ffe599', '#fff2cc', '#d9ead3', '#cfe2f3', '#d9d2e9']

const editor = useEditor({
  content: props.node.content || '',
  extensions: [
    StarterKit.configure({ codeBlock: false, link: false }),
    Underline, Color, TextStyleWithFontSize,
    Highlight,
    Link.configure({ openOnClick: false }),
    Markdown.configure({ html: false, breaks: true, linkify: true }),
    ResizableImage,
    ResizableCodeBlock,
    Table.configure({ resizable: true, HTMLAttributes: { style: 'border-collapse: collapse; table-layout: fixed; width: 100%;' } }),
    TableRow, TableCell, TableHeader,
  ],
  editorProps: { attributes: { style: 'min-height: 100%; padding-bottom: 40px;' } }
})

/* ---------- 自动保存(Markdown) ---------- */
let saveTimer = null
watch(() => editor.value?.getHTML(), () => {
  if (!editor.value) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    emit('save', { id: props.node.id, content: editor.value.storage.markdown.getMarkdown() })
  }, 600)
}, { deep: true })

watch(() => props.node.id, (nid, oid) => {
  if (!editor.value || nid === oid) return
  clearTimeout(saveTimer)
  editor.value.commands.setContent(props.node.content || '', false)
})
/* 视图状态变化 → 强制重绘代码框行号 */
watch(() => [props.showLn], () => {
  if (!editor.value) return
  const md = editor.value.storage.markdown.getMarkdown()
  editor.value.commands.setContent(md, false)
})

/* ---------- CherryTree 工具栏按钮直接调 App 处理 ---------- */
function exportPdf() { emit('app-menu', 'menu:exp-pdf') }

/* ---------- 剪贴板 ---------- */
function getSelText() { if (!editor.value) return ''; const { from, to, empty } = editor.value.state.selection; return empty ? '' : editor.value.state.doc.textBetween(from, to, ' ') }
function doCut() { const t = getSelText(); if (t) { window.api.clipboardWriteText(t); editor.value.chain().focus().deleteSelection().run() }; hideCtx() }
function doCopy() { const t = getSelText(); if (t) window.api.clipboardWriteText(t); hideCtx() }
async function doPaste() {
  const t = await window.api.clipboardReadText()
  if (t) editor.value.chain().focus().insertContent(t).run()
  hideCtx()
}
async function pastePlain() {
  const t = await window.api.clipboardReadText()
  if (t) editor.value.chain().focus().insertContent(t).run()
  hideCtx()
}

/* ---------- 插入功能 ---------- */
async function insertImage() {
  const r = await window.api.selectImage()
  if (!r) return
  editor.value.chain().focus().setImage({ src: r.dataUrl, alt: r.name, title: r.name, width: null, height: null }).run()
  hideCtx()
}
function insertTable() { tRows.value = 3; tCols.value = 3; tHeader.value = true; tableDlg.value = true; hideCtx() }
function confirmTable() {
  tableDlg.value = false
  editor.value.chain().focus().insertTable({ rows: Math.max(1, Math.min(50, tRows.value || 3)), cols: Math.max(1, Math.min(20, tCols.value || 3)), withHeaderRow: tHeader.value }).run()
}
function insertCodeBlock() { codeDlg.value = true; hideCtx() }
function confirmCode() {
  codeDlg.value = false
  editor.value.chain().focus().toggleCodeBlock().run()
  editor.value.chain().focus().setNodeSelection(editor.value.state.selection.from)
  hideCtx()
}
function insertTimestamp() {
  const n = new Date()
  const p = (x) => String(x).padStart(2, '0')
  const ts = `${n.getFullYear()}/${p(n.getMonth() + 1)}/${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
  editor.value.chain().focus().insertContent(ts).run()
  hideCtx()
}

/* ---------- 字号（小/中/大/特大） ---------- */
function setFontSize(px) { editor.value.chain().focus().setMark('textStyle', { fontSize: px + 'px' }).run() }

/* ---------- 文本颜色 / 背景色（简易循环色板） ---------- */
let colorIdx = 0
function pickTextColor() { editor.value.chain().focus().setColor(colorPalette[(colorIdx++ * 7) % 16]).run() }
function pickBgColor() { editor.value.chain().focus().toggleHighlight({ color: colorPalette[(colorIdx++ * 5 + 8) % 16] }).run() }

/* ---------- 待办事项列表（CherryTree ☐/☑ 风格） ---------- */
const isTodoList = computed(() => {
  if (!editor.value) return false
  const { $from } = editor.value.state.selection
  return $from.parent.textContent.startsWith('☐') || $from.parent.textContent.startsWith('☑')
})
function toggleTodoList() {
  if (!editor.value.isActive('bulletList')) editor.value.chain().focus().toggleBulletList().run()
  const { $from } = editor.value.state.selection
  const text = $from.parent.textContent || ''
  const start = $from.start()
  if (text.startsWith('☐')) { editor.value.chain().focus().deleteRange({ from: start, to: start + 1 }).insertContentAt(start, '☑').run() }
  else if (text.startsWith('☑')) { editor.value.chain().focus().deleteRange({ from: start, to: start + 1 }).insertContentAt(start, '☐').run() }
  else { editor.value.chain().focus().insertContentAt(start, '☐ ').run() }
  hideCtx()
}
function toggleTodoState() { toggleTodoList() }

/* ---------- 行操作（重复/删除/上移/下移行） ---------- */
function topBlockPos(state) {
  let pos = state.selection.$from
  while (pos.depth > 1) pos = pos.blockAt() ? state.selection.$from : pos
  const $f = state.selection.$from
  for (let d = $f.depth; d >= 0; d--) { if ($f.node(d).type.name === 'doc') { const node = $f.node(d - 1) || $f.parent; return { node, offset: $f.before(d - 1) || 0 } } }
  return null
}
function currentBlockRange() {
  const state = editor.value.state
  const $f = state.selection.$from
  for (let d = $f.depth; d >= 1; d--) {
    const parentIsDoc = $f.node(d - 1).type.name === 'doc'
    if (parentIsDoc) return { from: $f.before(d), to: $f.after(d), node: $f.node(d) }
  }
  return null
}
function dupLine() {
  const r = currentBlockRange(); if (!r) return
  const json = r.node.toJSON()
  editor.value.chain().focus().insertContentAt(r.to, json).run()
}
function delLine() {
  const r = currentBlockRange(); if (!r) return
  const docLen = editor.value.state.doc.content.size
  const from = Math.max(0, r.from), to = Math.min(docLen, r.to + (r.to < docLen ? 1 : 0))
  editor.value.chain().focus().deleteRange({ from, to }).run()
}
function moveLine(dir) {
  const state = editor.value.state
  const r = currentBlockRange(); if (!r) return
  const doc = state.doc
  let found = -1
  doc.forEach((n, i, off) => { if (off === r.from) found = i })
  const j = dir < 0 ? found - 1 : found + 1
  if (j < 0 || j >= doc.childCount) return
  const targetOff = dir < 0 ? 0 : r.to + 1
  editor.value.chain().focus().command(({ tr }) => {
    const node = doc.child(found)
    tr.delete(r.from, r.to + (r.to < doc.content.size ? 1 : 0))
    tr.insert(dir < 0 ? doc.child(j).nodeSize && offsetOf(doc, j) : r.from, node.toJSON() ? node : node)
    return true
  }).run()
}
function offsetOf(doc, index) { let off = 0; for (let i = 0; i < index; i++) off += doc.child(i).nodeSize; return off }

/* ---------- 链接 ---------- */
function toggleLink() {
  const url = prompt('请输入链接地址：', 'https://')
  if (!url) return
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  hideCtx()
}
function stripLink() { editor.value.chain().focus().extendMarkRange('link').unsetLink().run(); hideCtx() }

/* ---------- 查找/替换（window.find） ---------- */
function openFind() { findBar.value = true; setTimeout(() => findInput.value?.focus(), 50); hideCtx() }
function findNext(backwards) {
  if (!findText.value) return
  window.find(findText.value, false, backwards, true, false, false)
}
function doReplace() {
  if (!findText.value) return
  const sel = window.getSelection().toString()
  if (sel && sel.toLowerCase() === findText.value.toLowerCase()) {
    editor.value.chain().focus().insertContent(replaceText.value).run()
  }
  setTimeout(() => findNext(false), 50)
}

/* ---------- 格式化表格 ---------- */
function formatTable() {
  if (!editor.value.isActive('table')) { fmtDlg.value = false; return }
  fmtDlg.value = true
}
function confirmFmtTable() {
  fmtDlg.value = false
  const w = Math.max(40, Math.min(1000, fmtColW.value || 120))
  const { state } = editor.value
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'table') {
      const cols = node.firstChild ? node.firstChild.childCount : 1
      editor.value.chain().focus().command(({ tr }) => {
        tr.setNodeMarkup(pos, undefined, { colWidth: Array(cols).fill(w) })
        return true
      }).run()
      return false
    }
  })
}

/* ---------- 右键菜单 ---------- */
function showCtxMenu(e) { ctxX.value = e.clientX; ctxY.value = e.clientY; ctxMenuVisible.value = true }
function hideCtx() { ctxMenuVisible.value = false }

/* ---------- 全局菜单事件分发 ---------- */
function onEditorMenu(e) {
  if (!editor.value) return
  const a = e.detail.action
  const ch = editor.value.chain().focus()
  switch (a) {
    case 'menu:undo': ch.undo().run(); break
    case 'menu:redo': ch.redo().run(); break
    case 'menu:cut': doCut(); break
    case 'menu:copy': doCopy(); break
    case 'menu:paste': doPaste(); break
    case 'menu:paste-plain': pastePlain(); break
    case 'menu:paste-rich': doPaste(); break
    case 'menu:dup-line': dupLine(); break
    case 'menu:del-line': delLine(); break
    case 'menu:line-up': moveLine(-1); break
    case 'menu:line-down': moveLine(1); break
    case 'menu:format-table': formatTable(); break
    case 'menu:find': openFind(); break
    case 'menu:find-next': findNext(false); break
    case 'menu:find-prev': findNext(true); break
    case 'menu:find-selected': { const t = getSelText(); if (t) { findText.value = t; openFind(); findNext(false) } break }
    case 'menu:text-color': pickTextColor(); break
    case 'menu:bg-color': pickBgColor(); break
    case 'menu:bold': ch.toggleBold().run(); break
    case 'menu:italic': ch.toggleItalic().run(); break
    case 'menu:underline': ch.toggleUnderline().run(); break
    case 'menu:strike': ch.toggleStrike().run(); break
    case 'menu:small': setFontSize(11); break
    case 'menu:normal': setFontSize(14); break
    case 'menu:large': setFontSize(18); break
    case 'menu:huge': setFontSize(26); break
    case 'menu:n-list': ch.toggleOrderedList().run(); break
    case 'menu:b-list': ch.toggleBulletList().run(); break
    case 'menu:todo-list': toggleTodoList(); break
    case 'menu:list-dec': ch.liftListItem('listItem').run(); break
    case 'menu:list-inc': ch.sinkListItem('listItem').run(); break
    case 'menu:timestamp': insertTimestamp(); break
    case 'menu:remove-format': ch.unsetAllMarks().clearNodes().run(); break
    case 'menu:insert-image': insertImage(); break
    case 'menu:insert-table': insertTable(); break
    case 'menu:insert-code': insertCodeBlock(); break
    case 'menu:insert-hr': ch.setHorizontalRule().run(); break
  }
}

onMounted(() => {
  window.__ltPasteImg = (dataUrl) => {
    if (!editor.value) return
    editor.value.chain().focus().setImage({ src: dataUrl, alt: 'pasted-image', title: 'pasted-image', width: null, height: null }).run()
  }
  window.addEventListener('editor-menu', onEditorMenu)
  window.addEventListener('click', hideCtx)
  /* 点击 ☐/☑ 切换待办状态 */
  document.addEventListener('mousedown', onTodoClick)
})
function onTodoClick(ev) {
  if (!editor.value) return
  try {
    const pos = editor.value.view.posAtCoords({ left: ev.clientX, top: ev.clientY })
    if (!pos) return
    const $pos = editor.value.state.doc.resolve(pos.pos)
    const text = $pos.parent.textContent || ''
    if ((text.startsWith('☐') || text.startsWith('☑')) && pos.pos <= $pos.start() + 2) {
      setTimeout(() => toggleTodoList(), 0)
    }
  } catch {}
}
onUnmounted(() => {
  clearTimeout(saveTimer)
  editor.value?.destroy()
  delete window.__ltPasteImg
  window.removeEventListener('editor-menu', onEditorMenu)
  window.removeEventListener('click', hideCtx)
  document.removeEventListener('mousedown', onTodoClick)
})
</script>
