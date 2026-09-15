/**
 * ResizableCodeBlock - TipTap 代码框扩展，支持鼠标拖拽右下角调整高度
 * 包含语言标签栏、可选行号、右下角拖拽手柄
 */
import { Node, mergeAttributes } from '@tiptap/core'

export const ResizableCodeBlock = Node.create({
  name: 'resizableCodeBlock',

  inline: false,
  group: 'block',
  draggable: true,
  isolating: true,
  atom: true,

  addAttributes() {
    return {
      language: { default: 'text' },
      height: { default: 200 },
      showLineNumbers: { default: false },
      code: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'pre.lt-code-block' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        class: 'lt-code-block',
        'data-language': node.attrs.language || 'text',
        'data-height': node.attrs.height || 200,
        'data-line-numbers': node.attrs.showLineNumbers ? 'true' : 'false',
        style: `height: ${node.attrs.height || 200}px;`,
      }),
      node.attrs.code || '',
    ]
  },

  addCommands() {
    return {
      insertResizableCodeBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'resizableCodeBlock',
            attrs: {
              language: options.language || 'text',
              height: options.height || 200,
              showLineNumbers: options.showLineNumbers || false,
              code: options.code || '',
            },
          })
        },
      updateResizableCodeBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes('resizableCodeBlock', attrs)
        },
    }
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      // --- 容器 ---
      const wrapper = document.createElement('div')
      wrapper.classList.add('lt-codebox-wrapper')
      wrapper.style.position = 'relative'

      // --- 语言标签栏 ---
      const toolbar = document.createElement('div')
      toolbar.classList.add('lt-codebox-toolbar')
      const langLabel = document.createElement('span')
      langLabel.classList.add('lt-codebox-lang')
      langLabel.textContent = node.attrs.language || 'text'
      const lnLabel = document.createElement('span')
      lnLabel.classList.add('lt-codebox-ln')
      lnLabel.textContent = node.attrs.showLineNumbers ? '行号: 开' : '行号: 关'
      toolbar.appendChild(langLabel)
      toolbar.appendChild(lnLabel)
      wrapper.appendChild(toolbar)

      // --- 代码文本域 ---
      const textarea = document.createElement('textarea')
      textarea.classList.add('lt-codebox-textarea')
      textarea.value = node.attrs.code || ''
      textarea.style.height = (node.attrs.height || 200) + 'px'
      textarea.style.width = '100%'
      textarea.spellcheck = false
      wrapper.appendChild(textarea)

      // --- 右下角拖拽手柄 ---
      const handle = document.createElement('div')
      handle.classList.add('lt-codebox-resize-handle')
      handle.style.position = 'absolute'
      handle.style.bottom = '0'
      handle.style.right = '0'
      handle.style.width = '14px'
      handle.style.height = '14px'
      handle.style.cursor = 'nwse-resize'
      handle.style.background = 'linear-gradient(135deg, transparent 50%, #4a90d9 50%)'
      handle.style.zIndex = '10'
      handle.style.display = 'none'
      wrapper.appendChild(handle)

      wrapper.addEventListener('mouseenter', () => (handle.style.display = 'block'))
      wrapper.addEventListener('mouseleave', () => (handle.style.display = 'none'))

      // --- 拖拽调整高度 ---
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const startY = e.clientY
        const startH = textarea.offsetHeight
        const docMove = (ev) => {
          const newH = Math.max(80, startH + ev.clientY - startY)
          textarea.style.height = newH + 'px'
        }
        const docUp = () => {
          document.removeEventListener('mousemove', docMove)
          document.removeEventListener('mouseup', docUp)
          if (typeof getPos === 'function') {
            const pos = getPos()
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes('resizableCodeBlock', {
                height: textarea.offsetHeight,
                code: textarea.value,
              })
              .run()
          }
        }
        document.addEventListener('mousemove', docMove)
        document.addEventListener('mouseup', docUp)
      })

      // --- 同步内容到节点 ---
      textarea.addEventListener('blur', () => {
        if (typeof getPos === 'function') {
          const pos = getPos()
          editor
            .chain()
            .focus()
            .setNodeSelection(pos)
            .updateAttributes('resizableCodeBlock', { code: textarea.value })
            .run()
        }
      })

      return {
        dom: wrapper,
        update(p) {
          if (p.attrs.code !== textarea.value) textarea.value = p.attrs.code || ''
          textarea.style.height = (p.attrs.height || 200) + 'px'
          langLabel.textContent = p.attrs.language || 'text'
          lnLabel.textContent = p.attrs.showLineNumbers ? '行号: 开' : '行号: 关'
          return true
        },
        ignoreMutation(p) { return true },
        stopEvent() { return true },
      }
    }
  },
})
