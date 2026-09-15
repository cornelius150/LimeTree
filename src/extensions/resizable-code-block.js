import CodeBlock from '@tiptap/extension-code-block'
import { PluginKey } from '@tiptap/pm/state'

// Code block with resizable container
export const ResizableCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'rz-code-wrap'

      const box = document.createElement('div')
      box.className = 'rz-code-box'
      wrapper.appendChild(box)

      const pre = document.createElement('pre')
      box.appendChild(pre)

      // Render content
      const renderContent = () => {
        pre.textContent = node.textContent || ''
      }
      renderContent()

      // Resize handle at bottom-right
      const rzHandle = document.createElement('div')
      rzHandle.className = 'rz-code-rz'
      rzHandle.contentEditable = 'false'
      box.appendChild(rzHandle)

      let currentHeight = 200
      box.style.height = currentHeight + 'px'

      rzHandle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) return

        const startY = e.clientY
        const startH = box.offsetHeight

        const onMove = (ev) => {
          const dy = ev.clientY - startY
          currentHeight = Math.max(80, startH + dy)
          box.style.height = currentHeight + 'px'
        }

        const onUp = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      })

      return {
        dom: wrapper,
        contentDOM: pre,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false
          node = updatedNode
          renderContent()
          return true
        },
        ignoreMutation(mutation) {
          return mutation.type === 'attributes' && mutation.target === box
        }
      }
    }
  }
})
