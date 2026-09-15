import { Node, mergeAttributes } from '@tiptap/core'

// Resizable Image extension with drag-to-resize handles
export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null }
    }
  },
  parseHTML() {
    return [{ tag: 'img[src]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes)
    if (node.attrs.width) attrs.style = `width: ${node.attrs.width}px`
    return ['img', attrs]
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'resizable-img-wrap'

      const box = document.createElement('div')
      box.className = 'img-box'
      wrapper.appendChild(box)

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      img.title = node.attrs.title || ''
      if (node.attrs.width) img.style.width = node.attrs.width + 'px'
      box.appendChild(img)

      // Create 4 resize handles
      const positions = ['tl', 'tr', 'bl', 'br']
      const handles = {}
      positions.forEach(pos => {
        const handle = document.createElement('div')
        handle.className = 'rz-handle ' + pos
        handle.contentEditable = 'false'
        box.appendChild(handle)
        handles[pos] = handle

        handle.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!editor.isEditable) return

          const startX = e.clientX
          const startY = e.clientY
          const startW = img.offsetWidth
          const startH = img.offsetHeight
          const ratio = startW / startH

          const onMove = (ev) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            let newW, newH
            if (pos === 'br') { newW = Math.max(50, startW + dx); newH = newW / ratio }
            else if (pos === 'bl') { newW = Math.max(50, startW - dx); newH = newW / ratio }
            else if (pos === 'tr') { newW = Math.max(50, startW + dx); newH = newW / ratio }
            else { newW = Math.max(50, startW - dx); newH = newW / ratio }
            img.style.width = newW + 'px'
            img.style.height = newH + 'px'
          }

          const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            const finalW = img.offsetWidth
            editor.chain().focus().command(({ tr }) => {
              tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, width: finalW, height: null })
              return true
            }).run()
          }

          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp)
        })
      })

      // Click to select
      box.addEventListener('click', (e) => {
        e.stopPropagation()
        document.querySelectorAll('.resizable-img-wrap .img-box.selected').forEach(el => el.classList.remove('selected'))
        box.classList.add('selected')
      })

      return {
        dom: wrapper,
        update(updatedNode) {
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src
            img.alt = updatedNode.attrs.alt || ''
            img.title = updatedNode.attrs.title || ''
          }
          if (updatedNode.attrs.width) img.style.width = updatedNode.attrs.width + 'px'
          else img.style.width = ''
          return true
        },
        ignoreMutation() { return true },
        stopEvent() { return false }
      }
    }
  },
  addCommands() {
    return {
      setImage: (options) => ({ chain }) => chain().insertContent({ type: 'resizableImage', attrs: options }).run()
    }
  }
})
