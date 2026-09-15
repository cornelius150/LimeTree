import CodeBlock from '@tiptap/extension-code-block'
import { PluginKey } from '@tiptap/pm/state'

// Resizable Code Block with language label + optional line numbers + drag-to-resize
export const ResizableCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: { default: null, renderHTML: attrs => attrs.language ? { 'data-language': attrs.language } : {} },
      boxHeight: { default: 200, renderHTML: () => ({}) },
      showLn: { default: false, renderHTML: () => ({}) }
    }
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'rz-code-wrap'

      // Language label bar
      const langBar = document.createElement('div')
      langBar.className = 'rz-code-langbar'
      langBar.contentEditable = 'false'
      const langLabel = document.createElement('span')
      langLabel.className = 'rz-code-lang'
      langLabel.textContent = node.attrs.language || '代码'
      langBar.appendChild(langLabel)
      wrapper.appendChild(langBar)

      const box = document.createElement('div')
      box.className = 'rz-code-box'
      wrapper.appendChild(box)

      const pre = document.createElement('pre')
      box.appendChild(pre)

      // Line number gutter
      const gutter = document.createElement('div')
      gutter.className = 'rz-code-gutter'
      gutter.contentEditable = 'false'
      const showLn = node.attrs.showLn || document.body.classList.contains('lt-show-ln')
      if (showLn) box.classList.add('ln')
      box.appendChild(gutter)

      const renderContent = () => {
        pre.textContent = node.textContent || ''
        const lines = pre.textContent.split('\n')
        const visible = node.attrs.showLn || document.body.classList.contains('lt-show-ln')
        if (visible) {
          box.classList.add('ln')
          gutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('')
          gutter.style.height = box.style.height || (node.attrs.boxHeight || 200) + 'px'
        } else {
          box.classList.remove('ln')
          gutter.innerHTML = ''
        }
      }
      renderContent()

      box.style.height = (node.attrs.boxHeight || 200) + 'px'

      // Sync gutter scroll with pre
      pre.addEventListener('scroll', () => { gutter.scrollTop = pre.scrollTop })

      // Resize handle at bottom-right
      const rzHandle = document.createElement('div')
      rzHandle.className = 'rz-code-rz'
      rzHandle.contentEditable = 'false'
      box.appendChild(rzHandle)

      let currentHeight = node.attrs.boxHeight || 200
      rzHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation()
        if (!editor.isEditable) return
        const startY = e.clientY; const startH = box.offsetHeight
        const onMove = (ev) => { currentHeight = Math.max(80, startH + ev.clientY - startY); box.style.height = currentHeight + 'px'; gutter.style.height = currentHeight + 'px' }
        const onUp = () => {
          document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp)
          editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, boxHeight: currentHeight }); return true }).run()
        }
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
      })

      return {
        dom: wrapper,
        contentDOM: pre,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false
          node = updatedNode
          langLabel.textContent = node.attrs.language || '代码'
          if (node.attrs.boxHeight) { box.style.height = node.attrs.boxHeight + 'px'; gutter.style.height = node.attrs.boxHeight + 'px' }
          renderContent()
          return true
        },
        ignoreMutation(mutation) { return mutation.type === 'attributes' && (mutation.target === box || mutation.target === gutter || mutation.target === langBar) }
      }
    }
  }
})
