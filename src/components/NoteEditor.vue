<template>
  <div class="editor-area">
    <!-- ============ CherryTree 式工具栏 ============ -->
    <div class="editor-toolbar" v-if="editor && showToolbar">
      <!-- 组1: 新建节点 -->
      <button class="tb-btn" @click="$emit('app-menu', 'tree_add_node')" title="新建同级节点 (Ctrl+N)">
        <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6" fill="#e74c3c"/><rect x="7" y="16" width="10" height="5" rx="1" fill="#27ae60"/><text x="12" y="20" font-size="9" fill="#fff" text-anchor="middle" font-weight="bold">+</text></svg>
      </button>
      <button class="tb-btn" @click="$emit('app-menu', 'tree_add_subnode')" title="新建子节点 (Ctrl+J)">
        <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="7" r="5" fill="#e74c3c"/><line x1="12" y1="12" x2="12" y2="17" stroke="#999" stroke-width="1.5"/><circle cx="12" cy="19" r="4" fill="#e74c3c"/><rect x="8" y="21" width="8" height="3" rx="1" fill="#27ae60"/><text x="12" y="23" font-size="7" fill="#fff" text-anchor="middle" font-weight="bold">+</text></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组2: 后退/前进导航 -->
      <button class="tb-btn" @click="$emit('app-menu', 'menu:go-back')" title="后退">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5"><path d="M20 12H8M14 6l-6 6 6 6"/></svg>
      </button>
      <button class="tb-btn" @click="$emit('app-menu', 'menu:go-forward')" title="前进">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5"><path d="M4 12h12M10 6l6 6-6 6"/></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组3: 文件操作 -->
      <button class="tb-btn" @click="$emit('app-menu', 'ct_open_file')" title="打开笔记文件 (Ctrl+O)">
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 7l3-3h5l2 3h8v11H3V7z" fill="#f5a623" stroke="#d48800" stroke-width="1"/></svg>
      </button>
      <button class="tb-btn" @click="$emit('app-menu', 'ct_save')" title="保存 (Ctrl+S)">
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 3h14v18H5V3z M5 3v6h10V3 M8 13h8v6H8z" fill="#9b59b6" stroke="#7d4ea0" stroke-width="1"/></svg>
      </button>
      <button class="tb-btn" @click="$emit('app-menu', 'export_pdf')" title="导出">
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6V2z" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/><path d="M10 14l-3 3 3 3M14 14l3 3-3 3" stroke="#fff" stroke-width="1.5" fill="none"/></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组4: 搜索 -->
      <button class="tb-btn" @click="$emit('app-menu', 'find_in_allnodes')" title="搜索 (Ctrl+Shift+F)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21"/><circle cx="11" cy="11" r="2" fill="#e74c3c"/></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组5: 列表与缩进 -->
      <button class="tb-btn" :class="{active: editor.isActive('bulletList')}" @click="editor.chain().focus().toggleBulletList().run()" title="无序列表">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/><rect x="9" y="4" width="13" height="4" rx="1"/><rect x="9" y="10" width="13" height="4" rx="1"/><rect x="9" y="16" width="13" height="4" rx="1"/></svg>
      </button>
      <button class="tb-btn" :class="{active: editor.isActive('orderedList')}" @click="editor.chain().focus().toggleOrderedList().run()" title="有序编号列表">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><text x="1" y="8" font-size="7" font-weight="bold">1.</text><text x="1" y="15" font-size="7" font-weight="bold">2.</text><text x="1" y="22" font-size="7" font-weight="bold">3.</text><rect x="8" y="4" width="14" height="3" rx="1"/><rect x="8" y="11" width="14" height="3" rx="1"/><rect x="8" y="18" width="14" height="3" rx="1"/></svg>
      </button>
      <button class="tb-btn" :class="{active: isTodoList}" @click="toggleTodoList" title="待办列表">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="6" height="6" rx="1"/><path d="M4 7l2 2 3-4" stroke="#27ae60"/><rect x="3" y="12" width="6" height="6" rx="1"/><line x1="12" y1="7" x2="22" y2="7"/><line x1="12" y1="15" x2="22" y2="15"/></svg>
      </button>
      <button class="tb-btn" @click="editor.chain().focus().sinkListItem('listItem').run()" title="增加缩进">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 9l3 3-3 3"/></svg>
      </button>
      <button class="tb-btn" @click="editor.chain().focus().liftListItem('listItem').run()" title="减少缩进">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M11 9l-3 3 3 3"/></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组6: 插入元素 -->
      <button class="tb-btn" @click="insertImage" title="插入图片（可拖拽缩放）">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8" cy="9" r="2"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>
      </button>
      <button class="tb-btn" @click="insertTable" title="插入表格（可拖拽缩放列宽）">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      </button>
      <button class="tb-btn" @click="insertCodeBlock" title="插入代码框（可拖拽缩放）">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6l-5 6 5 6M16 6l5 6-5 6"/></svg>
      </button>
      <button class="tb-btn" @click="toggleLink" title="插入超链接">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 15l6-6"/><path d="M8 12l-3 3a4 4 0 0 0 6 6l3-3"/><path d="M16 12l3-3a4 4 0 0 0-6-6l-3 3"/></svg>
      </button>
      <button class="tb-btn" @click="stripLink" title="取消超链接">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 15l6-6"/><path d="M8 12l-3 3a4 4 0 0 0 5 5"/><path d="M16 12l3-3a4 4 0 0 0-5-5"/><line x1="3" y1="3" x2="21" y2="21" stroke="#e74c3c"/></svg>
      </button>
      <button class="tb-btn" @click="insertAnchor" title="插入锚点">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M12 7v13M5 12a7 7 0 0 0 14 0"/></svg>
      </button>
      <span class="tb-sep"></span>
      <!-- 组7: 格式化 — 清除格式/颜色/高亮/粗斜下删 -->
      <button class="tb-btn" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()" title="清除格式">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="4" y="16" font-size="13" font-weight="bold">A</text><line x1="3" y1="20" x2="21" y2="4" stroke="#e74c3c"/></svg>
      </button>
      <!-- 字体颜色面板 -->
      <div class="tb-color-wrap">
        <button class="tb-btn" @click="showColorPicker = !showColorPicker" title="文字颜色 (Ctrl+Shift+T)">
          <svg width="20" height="20" viewBox="0 0 24 24"><text x="5" y="16" font-size="14" font-weight="bold" :fill="currentColor">A</text><path d="M3 18h18v2H3z" fill="#e91e63"/></svg>
        </button>
        <div v-if="showColorPicker" class="tb-color-dd" @click.stop>
          <div class="tb-color-grid">
            <span v-for="c in colorPalette" :key="c" class="tb-color-sw" :style="{ background: c }" @click="applyTextColor(c)"></span>
          </div>
        </div>
      </div>
      <!-- 背景色面板 -->
      <div class="tb-color-wrap">
        <button class="tb-btn" @click="showBgPicker = !showBgPicker" title="文字背景色 (Ctrl+Shift+H)">
          <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" :fill="currentBgColor"/><text x="5" y="16" font-size="14" font-weight="bold" fill="#333">A</text></svg>
        </button>
        <div v-if="showBgPicker" class="tb-color-dd" @click.stop>
          <div class="tb-color-grid">
            <span v-for="c in bgPalette" :key="c" class="tb-color-sw" :style="{ background: c }" @click="applyBgColor(c)"></span>
          </div>
        </div>
      </div>
      <button class="tb-btn" :class="{active: editor.isActive('bold')}" @click="editor.chain().focus().toggleBold().run()" title="加粗 (Ctrl+B)"><b style="font-size:15px">A</b></button>
      <button class="tb-btn" :class="{active: editor.isActive('italic')}" @click="editor.chain().focus().toggleItalic().run()" title="斜体 (Ctrl+I)"><i style="font-size:15px">A</i></button>
      <button class="tb-btn" :class="{active: editor.isActive('underline')}" @click="editor.chain().focus().toggleUnderline().run()" title="下划线 (Ctrl+U)"><u style="font-size:15px">A</u></button>
      <button class="tb-btn" :class="{active: editor.isActive('strike')}" @click="editor.chain().focus().toggleStrike().run()" title="删除线"><s style="font-size:15px">A</s></button>
      <span class="tb-sep"></span>
      <!-- 组8: 标题/代码/上标下标 -->
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:1})}" @click="editor.chain().focus().toggleHeading({level:1}).run()" title="标题1">h1</button>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:2})}" @click="editor.chain().focus().toggleHeading({level:2}).run()" title="标题2">h2</button>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('heading', {level:3})}" @click="editor.chain().focus().toggleHeading({level:3}).run()" title="标题3">h3</button>
      <button class="tb-btn tb-text" @click="editor.chain().focus().toggleStrike().run()" title="删除线(s)">s</button>
      <button class="tb-btn tb-text" @click="toggleSuperscript" title="上标"><span style="font-size:11px;vertical-align:super">a</span><span style="font-size:8px;vertical-align:super">s</span></button>
      <button class="tb-btn tb-text" @click="toggleSubscript" title="下标"><span style="font-size:11px;vertical-align:sub">a</span><span style="font-size:8px;vertical-align:sub">s</span></button>
      <button class="tb-btn tb-text" :class="{active: editor.isActive('code')}" @click="editor.chain().focus().toggleCode().run()" title="等宽行内代码(ms)"><span style="font-family:monospace;font-size:12px">ms</span></button>
      <span class="tb-sep"></span>
      <!-- 组9: 字体与字号 -->
      <select class="tb-select" @change="onFontFamilyChange($event)" title="字体">
        <option value="">字体</option>
        <option v-for="f in fontFamilies" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
      </select>
      <select class="tb-select" @change="onFontSizeChange($event)" title="字号">
        <option value="">字号</option>
        <option value="10">10</option><option value="11">11</option><option value="12">12</option>
        <option value="14">14</option><option value="16">16</option><option value="18">18</option>
        <option value="20">20</option><option value="24">24</option><option value="28">28</option><option value="32">32</option>
      </select>
      <span class="tb-sep"></span>
      <!-- 组10: 时间戳 -->
      <button class="tb-btn" @click="insertTimestamp" title="插入时间戳 (Ctrl+;)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
      </button>
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
    <div v-if="ctxMenuVisible" class="ctx-menu" :style="{ left: ctxX+'px', top: ctxY+'px' }" @click.stop @contextmenu.prevent>
      <div class="ctx-item" @click.stop="doCut"><span class="ctx-icon">✂️</span>剪切<span class="ctx-key">Ctrl+X</span></div>
      <div class="ctx-item" @click.stop="doCopy"><span class="ctx-icon">📋</span>复制<span class="ctx-key">Ctrl+C</span></div>
      <div class="ctx-item" @click.stop="doPaste"><span class="ctx-icon">📄</span>粘贴<span class="ctx-key">Ctrl+V</span></div>
      <div class="ctx-item" @click.stop="pastePlain"><span class="ctx-icon">🧾</span>粘贴为纯文本<span class="ctx-key">Ctrl+Alt+P</span></div>
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

/* TextStyle 扩展加 fontSize + fontFamily 属性 */
const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        parseHTML: el => el.style.fontSize || null
      },
      fontFamily: {
        default: null,
        renderHTML: attrs => {
          const styles = []
          if (attrs.fontSize) styles.push(`font-size: ${attrs.fontSize}`)
          if (attrs.fontFamily) styles.push(`font-family: ${attrs.fontFamily}`)
          return styles.length ? { style: styles.join('; ') } : {}
        },
        parseHTML: el => el.style.fontFamily || null
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
  '#808080', '#c0c0c0', '#ffcccc', '#ffe599', '#fff2cc', '#d9ead3', '#cfe2f3', '#d9d2e9',
  '#333333', '#666666', '#999999', '#cc0000', '#e69100', '#bf9000', '#38761d', '#134f5c',
  '#0b5394', '#741b47', '#3d85c6', '#6aa84f', '#e06666', '#f6b26b', '#ffd966', '#93c47d']
const bgPalette = ['transparent', '#ffff00', '#ff9900', '#ffcccc', '#ffe599', '#fff2cc', '#d9ead3', '#cfe2f3',
  '#d9d2e9', '#ffd9b3', '#f4cccc', '#fce5cd', '#d9ead3', '#c9daf8', '#d9d2e9', '#ead1dc',
  '#fffacd', '#e6ffe6', '#e6f3ff', '#ffe6e6', '#f0e6ff', '#ffffe0', '#f5f5dc', '#ffffff']
const fontFamilies = ['Microsoft YaHei', 'SimSun', 'KaiTi', 'SimHei', 'FangSong', 'Microsoft YaHei UI',
  'Consolas', 'Courier New', 'Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Georgia',
  'Verdana', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Source Code Pro']
const showColorPicker = ref(false); const showBgPicker = ref(false)
const currentColor = ref('#333333'); const currentBgColor = ref('#fffacd')

const editor = useEditor({
  content: props.node.content || '',
  extensions: [
    StarterKit.configure({ codeBlock: false }),
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
function doCut() {
  try {
    if (!editor.value) return
    const { from, to, empty } = editor.value.state.selection
    if (!empty) {
      const text = editor.value.state.doc.textBetween(from, to, ' ')
      window.api.clipboardWriteText(text)
      editor.value.chain().focus().deleteSelection().run()
    }
  } catch(e) { console.error('doCut error:', e) }
  hideCtx()
}
function doCopy() {
  try {
    if (!editor.value) return
    const { from, to, empty } = editor.value.state.selection
    if (!empty) {
      const text = editor.value.state.doc.textBetween(from, to, ' ')
      window.api.clipboardWriteText(text)
    }
  } catch(e) { console.error('doCopy error:', e) }
  hideCtx()
}
async function doPaste() {
  try {
    if (!editor.value) return
    const t = await window.api.clipboardReadText()
    if (t) editor.value.chain().focus().insertContent(t).run()
  } catch(e) { console.error('doPaste error:', e) }
  hideCtx()
}
async function pastePlain() {
  const t = await window.api.clipboardReadText()
  if (t) editor.value.chain().focus().insertContent(t).run()
  hideCtx()
}

/* ---------- 插入功能 ---------- */
async function insertImage() {
  try {
    const r = await window.api.selectImage()
    if (!r) return
    editor.value.chain().focus().setImage({ src: r.dataUrl, alt: r.name, title: r.name, width: null, height: null }).run()
  } catch(e) { console.error('insertImage error:', e) }
  hideCtx()
}
function insertTable() { tRows.value = 3; tCols.value = 3; tHeader.value = true; tableDlg.value = true; hideCtx() }
function confirmTable() {
  tableDlg.value = false
  try {
    editor.value.chain().focus().insertTable({ rows: Math.max(1, Math.min(50, tRows.value || 3)), cols: Math.max(1, Math.min(20, tCols.value || 3)), withHeaderRow: tHeader.value }).run()
  } catch(e) { console.error('confirmTable error:', e) }
}
function insertCodeBlock() { codeDlg.value = true; hideCtx() }
function confirmCode() {
  codeDlg.value = false
  try {
    editor.value.chain().focus().toggleCodeBlock().run()
    // 设置代码框属性
    setTimeout(() => {
      try {
        const pos = editor.value.state.selection.$from
        for (let d = pos.depth; d >= 1; d--) {
          if (pos.node(d).type.name === 'codeBlock') {
            editor.value.chain().focus().command(({ tr }) => {
              tr.setNodeMarkup(pos.before(d), undefined, { language: codeLang.value || '', boxHeight: codeHeight.value || 200, showLn: codeLn.value })
              return true
            }).run()
            break
          }
        }
      } catch(e) { console.error('setCodeAttrs error:', e) }
    }, 50)
  } catch(e) { console.error('confirmCode error:', e) }
  hideCtx()
}
function insertTimestamp() {
  try {
    const n = new Date()
    const p = (x) => String(x).padStart(2, '0')
    const ts = `${n.getFullYear()}/${p(n.getMonth() + 1)}/${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
    editor.value.chain().focus().insertContent(ts).run()
  } catch(e) { console.error('timestamp error:', e) }
  hideCtx()
}

/* ---------- 字号 ---------- */
function setFontSize(px) { try { editor.value.chain().focus().setMark('textStyle', { fontSize: px + 'px' }).run() } catch(e) { console.error('setFontSize error:', e) } }
function onFontSizeChange(e) { const v = e.target.value; if (v) { setFontSize(v); e.target.value = '' } }
function onFontFamilyChange(e) { const v = e.target.value; if (v) { try { editor.value.chain().focus().setMark('textStyle', { fontFamily: v }).run() } catch(err) { console.error(err) }; e.target.value = '' } }

/* ---------- 文本颜色 / 背景色 ---------- */
let colorIdx = 0
function pickTextColor() { try { editor.value.chain().focus().setColor(colorPalette[(colorIdx++ * 7) % 16]).run() } catch(e) { console.error(e) } }
function pickBgColor() { try { editor.value.chain().focus().toggleHighlight({ color: bgPalette[(colorIdx++ * 5 + 1) % 24] }).run() } catch(e) { console.error(e) } }
function toggleHighlight() { try { editor.value.chain().focus().toggleHighlight({ color: '#fffacd' }).run() } catch(e) { console.error(e) } }
function applyTextColor(c) { try { currentColor.value = c; editor.value.chain().focus().setColor(c).run() } catch(e) { console.error(e) }; showColorPicker.value = false }
function applyBgColor(c) { try { if (c === 'transparent') editor.value.chain().focus().unsetHighlight().run(); else editor.value.chain().focus().toggleHighlight({ color: c }).run() } catch(e) { console.error(e) }; currentBgColor.value = c; showBgPicker.value = false }

/* ---------- 待办事项列表（CherryTree ☐/☑ 风格） ---------- */
const isTodoList = computed(() => {
  if (!editor.value) return false
  const { $from } = editor.value.state.selection
  return $from.parent.textContent.startsWith('☐') || $from.parent.textContent.startsWith('☑')
})
function toggleTodoList() {
  try {
    if (!editor.value.isActive('bulletList')) editor.value.chain().focus().toggleBulletList().run()
    const { $from } = editor.value.state.selection
    const text = $from.parent.textContent || ''
    const start = $from.start()
    if (text.startsWith('☐')) { editor.value.chain().focus().deleteRange({ from: start, to: start + 1 }).insertContentAt(start, '☑').run() }
    else if (text.startsWith('☑')) { editor.value.chain().focus().deleteRange({ from: start, to: start + 1 }).insertContentAt(start, '☐').run() }
    else { editor.value.chain().focus().insertContentAt(start, '☐ ').run() }
  } catch(e) { console.error('toggleTodoList error:', e) }
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
  try {
    const url = prompt('请输入链接地址：', 'https://')
    if (!url) return
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } catch(e) { console.error('toggleLink error:', e) }
  hideCtx()
}
function stripLink() { try { editor.value.chain().focus().extendMarkRange('link').unsetLink().run() } catch(e) { console.error(e) }; hideCtx() }

/* ---------- 锚点 ---------- */
function insertAnchor() {
  try {
    const name = prompt('请输入锚点名称：', 'anchor')
    if (!name) return
    editor.value.chain().focus().insertContent(`⚓ ${name}`).run()
  } catch(e) { console.error('insertAnchor error:', e) }
  hideCtx()
}

/* ---------- 上标/下标 ---------- */
function toggleSuperscript() {
  try {
    const sel = editor.value.state.selection
    if (sel.empty) return
    const text = editor.value.state.doc.textBetween(sel.from, sel.to, '')
    editor.value.chain().focus().deleteSelection().insertContent(`<sup>${text}</sup>`).run()
  } catch(e) { console.error('superscript error:', e) }
}
function toggleSubscript() {
  try {
    const sel = editor.value.state.selection
    if (sel.empty) return
    const text = editor.value.state.doc.textBetween(sel.from, sel.to, '')
    editor.value.chain().focus().deleteSelection().insertContent(`<sub>${text}</sub>`).run()
  } catch(e) { console.error('subscript error:', e) }
}

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
  try {
  const ch = editor.value.chain().focus()
  switch (a) {
    /* 编辑 */
    case 'act_undo': ch.undo().run(); break
    case 'act_redo': ch.redo().run(); break
    case 'cut_plain': doCut(); break
    case 'copy_plain': doCopy(); break
    case 'paste_plain': doPaste(); break
    case 'dup_row': dupLine(); break
    case 'del_row': delLine(); break
    case 'mv_up_row': moveLine(-1); break
    case 'mv_down_row': moveLine(1); break

    /* 插入 */
    case 'handle_image': insertImage(); break
    case 'handle_table': insertTable(); break
    case 'handle_codebox': insertCodeBlock(); break
    case 'handle_link': toggleLink(); break
    case 'handle_anchor': insertAnchor(); break
    case 'handle_bull_list': ch.toggleBulletList().run(); break
    case 'handle_num_list': ch.toggleOrderedList().run(); break
    case 'handle_todo_list': toggleTodoList(); break
    case 'insert_timestamp': insertTimestamp(); break
    case 'insert_horiz_rule': ch.setHorizontalRule().run(); break
    case 'insert_toc': ch.insertContent('目录\n').run(); break
    case 'insert_special_char': { const c = prompt('输入特殊字符：'); if (c) ch.insertContent(c).run(); break }
    case 'handle_embfile': { alert('插入文件功能即将推出'); break }

    /* 格式化 */
    case 'fmt_color_fg': showColorPicker.value = !showColorPicker.value; break
    case 'fmt_color_bg': showBgPicker.value = !showBgPicker.value; break
    case 'fmt_bold': ch.toggleBold().run(); break
    case 'fmt_italic': ch.toggleItalic().run(); break
    case 'fmt_underline': ch.toggleUnderline().run(); break
    case 'fmt_strikethrough': ch.toggleStrike().run(); break
    case 'fmt_monospace': ch.toggleCode().run(); break
    case 'fmt_small': setFontSize(11); break
    case 'fmt_subscript': toggleSubscript(); break
    case 'fmt_superscript': toggleSuperscript(); break
    case 'fmt_h1': ch.toggleHeading({level:1}).run(); break
    case 'fmt_h2': ch.toggleHeading({level:2}).run(); break
    case 'fmt_h3': ch.toggleHeading({level:3}).run(); break
    case 'fmt_h4': ch.toggleHeading({level:4}).run(); break
    case 'fmt_h5': ch.toggleHeading({level:5}).run(); break
    case 'fmt_h6': ch.toggleHeading({level:6}).run(); break
    case 'fmt_indent': ch.sinkListItem('listItem').run(); break
    case 'fmt_unindent': ch.liftListItem('listItem').run(); break
    case 'fmt_rm': ch.unsetAllMarks().clearNodes().run(); break
    case 'fmt_clone': ch.unsetAllMarks().clearNodes().run(); break
    case 'fmt_latest': ch.unsetAllMarks().clearNodes().run(); break
    case 'case_down': { const s = getSelText(); if (s) ch.insertContent(s.toLowerCase()).run(); break }
    case 'case_up': { const s = getSelText(); if (s) ch.insertContent(s.toUpperCase()).run(); break }
    case 'case_tggl': { const s = getSelText(); if (s) ch.insertContent(s === s.toUpperCase() ? s.toLowerCase() : s.toUpperCase()).run(); break }
    case 'fmt_justify_left': ch.unsetAllMarks().run(); break
    case 'fmt_justify_center': ch.unsetAllMarks().run(); break
    case 'fmt_justify_right': ch.unsetAllMarks().run(); break
    case 'fmt_justify_fill': ch.unsetAllMarks().run(); break
    case 'head_expand': break
    case 'head_collapse': break

    /* 搜索 */
    case 'find_in_node': openFind(); break
    case 'find_iter_fw': findNext(false); break
    case 'find_iter_bw': findNext(true); break
    case 'replace_in_node': openFind(); break
    case 'replace_iter_fw': doReplace(); break

    /* 工具 */
    case 'spellcheck_toggle': alert('拼写检查功能暂未启用'); break
    case 'exec_code_los': break
    case 'exec_code_all': break
    case 'strip_trail_spaces': { const md = editor.value.storage.markdown.getMarkdown(); ch.insertContent(md.replace(/[ \t]+$/gm, '')).run(); break }
    case 'repl_tabs_spaces': { const md = editor.value.storage.markdown.getMarkdown(); ch.insertContent(md.replace(/\t/g, '    ')).run(); break }
    case 'command_palette': break

    /* 表格 */
    case 'table_column_add': ch.addColumnAfter().run(); break
    case 'table_column_delete': ch.deleteColumn().run(); break
    case 'table_column_left': break
    case 'table_column_right': break
    case 'table_row_add': ch.addRowAfter().run(); break
    case 'table_row_delete': ch.deleteRow().run(); break
    case 'table_row_up': ch.deleteRow().run(); break
    case 'table_row_down': ch.deleteRow().run(); break
    case 'table_delete': ch.deleteTable().run(); break
    case 'table_edit_properties': formatTable(); break

    /* 代码框 */
    case 'codebox_change_properties': insertCodeBlock(); break
    case 'codebox_increase_width': break
    case 'codebox_decrease_width': break
    case 'codebox_increase_height': break
    case 'codebox_decrease_height': break

    default: console.log('Unhandled editor menu action:', a)
  }
  } catch(e) { console.error('onEditorMenu error for', a, ':', e) }
}

onMounted(() => {
  window.__ltPasteImg = (dataUrl) => {
    if (!editor.value) return
    editor.value.chain().focus().setImage({ src: dataUrl, alt: 'pasted-image', title: 'pasted-image', width: null, height: null }).run()
  }
  window.addEventListener('editor-menu', onEditorMenu)
  window.addEventListener('click', () => { hideCtx(); showColorPicker.value = false; showBgPicker.value = false })
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
