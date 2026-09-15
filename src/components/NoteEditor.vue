<template>
  <div class="editor-area">
    <div class="editor-toolbar" v-if="editor">
      <button class="tb-btn" @click="$emit('add-sibling')" title="添加同级节点">➕</button>
      <button class="tb-btn" @click="$emit('add-child')" title="添加子节点">📂</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="撤销">↶</button>
      <button class="tb-btn" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="重做">↷</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="$emit('export')" title="导出为 Markdown">📤</button>
      <button class="tb-btn" @click="$emit('export-html')" title="导出为 HTML">🌐</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="$emit('toggle-search')" title="查找">🔍</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" :class="{active: editor.isActive('bulletList')}" @click="editor.chain().focus().toggleBulletList().run()" title="无序列表">•</button>
      <button class="tb-btn" :class="{active: editor.isActive('orderedList')}" @click="editor.chain().focus().toggleOrderedList().run()" title="有序列表">1.</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="insertImage" title="插入图片（可拖拽缩放）">🖼️</button>
      <button class="tb-btn" @click="insertTable" title="插入表格（可拖拽缩放列宽）">📊</button>
      <button class="tb-btn" @click="insertCodeBlock" title="插入代码框（可拖拽缩放）">📝</button>
      <button class="tb-btn" @click="editor.chain().focus().setHorizontalRule().run()" title="分割线">―</button>
      <button class="tb-btn" @click="editor.chain().focus().toggleBlockquote().run()" title="引用">❝</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" :class="{active: editor.isActive('bold')}" @click="editor.chain().focus().toggleBold().run()" title="加粗"><b>B</b></button>
      <button class="tb-btn" :class="{active: editor.isActive('italic')}" @click="editor.chain().focus().toggleItalic().run()" title="斜体"><i>I</i></button>
      <button class="tb-btn" :class="{active: editor.isActive('underline')}" @click="editor.chain().focus().toggleUnderline().run()" title="下划线"><u>U</u></button>
      <button class="tb-btn" :class="{active: editor.isActive('strike')}" @click="editor.chain().focus().toggleStrike().run()" title="删除线"><s>S</s></button>
      <button class="tb-btn" :class="{active: editor.isActive('code')}" @click="editor.chain().focus().toggleCode().run()" title="行内代码">&lt;/&gt;</button>
      <span class="tb-sep"></span>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:1})}" @click="editor.chain().focus().toggleHeading({level:1}).run()">H1</button>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:2})}" @click="editor.chain().focus().toggleHeading({level:2}).run()">H2</button>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:3})}" @click="editor.chain().focus().toggleHeading({level:3}).run()">H3</button>
      <span class="tb-sep"></span>
      <button class="tb-btn" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()" title="清除格式">🚫</button>
      <template v-if="editor.isActive('table')">
        <span class="tb-sep"></span>
        <button class="tb-btn" @click="editor.chain().focus().addRowBefore().run()" title="上方插入行">⬆行</button>
        <button class="tb-btn" @click="editor.chain().focus().addRowAfter().run()" title="下方插入行">⬇行</button>
        <button class="tb-btn" @click="editor.chain().focus().addColumnBefore().run()" title="左侧插入列">⬅列</button>
        <button class="tb-btn" @click="editor.chain().focus().addColumnAfter().run()" title="右侧插入列">➡列</button>
        <button class="tb-btn" @click="editor.chain().focus().deleteRow().run()" title="删除行">🗑行</button>
        <button class="tb-btn" @click="editor.chain().focus().deleteColumn().run()" title="删除列">🗑列</button>
        <button class="tb-btn" @click="editor.chain().focus().deleteTable().run()" title="删除表格">🗑表</button>
      </template>
    </div>

    <div class="editor-content" @contextmenu.prevent="showCtxMenu">
      <editor-content :editor="editor" />
    </div>

    <!-- Right-click context menu -->
    <div v-if="ctxMenuVisible" class="ctx-menu" :style="{ left: ctxX+'px', top: ctxY+'px' }" @click.stop>
      <div class="ctx-item" @click="doCut"><span class="ctx-icon">✂️</span>剪切<span class="ctx-key">Ctrl+X</span></div>
      <div class="ctx-item" @click="doCopy"><span class="ctx-icon">📋</span>复制<span class="ctx-key">Ctrl+C</span></div>
      <div class="ctx-item" @click="doPaste"><span class="ctx-icon">📄</span>粘贴<span class="ctx-key">Ctrl+V</span></div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="editor.chain().focus().undo().run()" :class="{disabled: !editor.can().undo()}"><span class="ctx-icon">↶</span>撤销</div>
      <div class="ctx-item" @click="editor.chain().focus().redo().run()" :class="{disabled: !editor.can().redo()}"><span class="ctx-icon">↷</span>重做</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="insertImage"><span class="ctx-icon">🖼️</span>插入图片</div>
      <div class="ctx-item" @click="insertTable"><span class="ctx-icon">📊</span>插入表格</div>
      <div class="ctx-item" @click="insertCodeBlock"><span class="ctx-icon">📝</span>插入代码框</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="editor.chain().focus().toggleBold().run()" :class="{active: editor.isActive('bold')}"><span class="ctx-icon">B</span>加粗</div>
      <div class="ctx-item" @click="editor.chain().focus().toggleItalic().run()" :class="{active: editor.isActive('italic')}"><span class="ctx-icon">I</span>斜体</div>
      <div class="ctx-item" @click="editor.chain().focus().toggleUnderline().run()" :class="{active: editor.isActive('underline')}"><span class="ctx-icon">U</span>下划线</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="$emit('export')"><span class="ctx-icon">📤</span>导出为 Markdown</div>
    </div>

    <!-- Table dialog -->
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
          <button class="modal-btn modal-btn-ok" @click="confirmTable">确定插入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Underline } from '@tiptap/extension-underline'
import { Markdown } from 'tiptap-markdown'
import { ResizableImage } from '../extensions/resizable-image.js'
import { ResizableCodeBlock } from '../extensions/resizable-code-block.js'

const props = defineProps({ node: Object })
const emit = defineEmits(['save', 'export', 'export-html', 'add-sibling', 'add-child', 'toggle-search'])

const ctxMenuVisible = ref(false); const ctxX = ref(0); const ctxY = ref(0)
const tableDlg = ref(false); const tRows = ref(3); const tCols = ref(3); const tHeader = ref(true)

const editor = useEditor({
  content: props.node.content || '',
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Underline,
    Markdown.configure({ html: false, breaks: true, linkify: true }),
    ResizableImage,
    ResizableCodeBlock,
    Table.configure({ resizable: true, HTMLAttributes: { style: 'border-collapse: collapse; table-layout: fixed; width: 100%;' } }),
    TableRow, TableCell, TableHeader,
  ],
  editorProps: { attributes: { style: 'min-height: 100%; padding-bottom: 40px;' } }
})

// Auto-save as Markdown
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
  editor.value.commands.setContent(props.node.content || '', false)
})

onUnmounted(() => {
  clearTimeout(saveTimer)
  editor.value?.destroy()
  delete window.__ltPasteImg
  window.removeEventListener('editor-menu', onEditorMenu)
})

// Right-click menu
function showCtxMenu(e) { ctxX.value = e.clientX; ctxY.value = e.clientY; ctxMenuVisible.value = true }
function hideCtxMenu() { ctxMenuVisible.value = false }

// Clipboard operations
function getSelText() { if (!editor.value) return ''; const { from, to, empty } = editor.value.state.selection; return empty ? '' : editor.value.state.doc.textBetween(from, to, ' ') }
function doCut() { const t = getSelText(); if (t) { window.api.clipboardWriteText(t); editor.value.chain().focus().deleteSelection().run() }; hideCtxMenu() }
function doCopy() { const t = getSelText(); if (t) window.api.clipboardWriteText(t); hideCtxMenu() }
async function doPaste() {
  const t = await window.api.clipboardReadText()
  if (t) editor.value.chain().focus().insertContent(t).run()
  hideCtxMenu()
}

// Insert functions
async function insertImage() {
  const r = await window.api.selectImage()
  if (!r) return
  editor.value.chain().focus().setImage({ src: r.dataUrl, alt: r.name, title: r.name, width: null, height: null }).run()
}
function insertTable() { tRows.value = 3; tCols.value = 3; tHeader.value = true; tableDlg.value = true }
function confirmTable() {
  tableDlg.value = false
  editor.value.chain().focus().insertTable({ rows: Math.max(1, Math.min(50, tRows.value || 3)), cols: Math.max(1, Math.min(20, tCols.value || 3)), withHeaderRow: tHeader.value }).run()
}
function insertCodeBlock() { editor.value.chain().focus().toggleCodeBlock().run() }

// Global image paste handler — called by main process before-input-event
onMounted(() => {
  window.__ltPasteImg = (dataUrl) => {
    if (!editor.value) return
    editor.value.chain().focus().setImage({ src: dataUrl, alt: 'pasted-image', title: 'pasted-image', width: null, height: null }).run()
  }
  window.addEventListener('editor-menu', onEditorMenu)
  window.addEventListener('click', hideCtxMenu)
})

// Menu events from main process
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
    case 'menu:insert-image': insertImage(); break
    case 'menu:insert-table': insertTable(); break
    case 'menu:insert-code': insertCodeBlock(); break
    case 'menu:insert-hr': ch.setHorizontalRule().run(); break
    case 'menu:insert-quote': ch.toggleBlockquote().run(); break
    case 'menu:bold': ch.toggleBold().run(); break
    case 'menu:italic': ch.toggleItalic().run(); break
    case 'menu:underline': ch.toggleUnderline().run(); break
    case 'menu:strike': ch.toggleStrike().run(); break
    case 'menu:code': ch.toggleCode().run(); break
    case 'menu:h1': ch.toggleHeading({ level: 1 }).run(); break
    case 'menu:h2': ch.toggleHeading({ level: 2 }).run(); break
    case 'menu:h3': ch.toggleHeading({ level: 3 }).run(); break
    case 'menu:bullet-list': ch.toggleBulletList().run(); break
    case 'menu:ordered-list': ch.toggleOrderedList().run(); break
    case 'menu:clear-format': ch.unsetAllMarks().clearNodes().run(); break
    case 'menu:select-all': editor.value.chain().focus().selectAll().run(); break
  }
}
</script>
