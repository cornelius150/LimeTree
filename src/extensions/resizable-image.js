/**
 * ResizableImage - TipTap 图片扩展，支持鼠标拖拽四角缩放
 * 基于 Image extension，添加 NodeView 实现拖拽手柄
 */
import { Node, mergeAttributes } from '@tiptap/core'

export const ResizableImage = Node.create({
  name: 'resizableImage',

  inline: false,
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    }
  },

  parseHTML() {
    return [
      { tag: 'img[src]' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = []
    if (node.attrs.width) style.push(`width: ${node.attrs.width}px`)
    if (node.attrs.height) style.push(`height: ${node.attrs.height}px`)
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        src: node.attrs.src,
        alt: node.attrs.alt,
        title: node.attrs.title,
        style: style.join('; ') || null,
        class: 'lt-resizable-image',
      }),
    ]
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'resizableImage',
            attrs: options,
          })
        },
    }
  },

  addNodeView() {
    return ({ node, getPos, editor, HTMLAttributes }) => {
      // --- DOM ---
      const wrapper = document.createElement('div')
      wrapper.classList.add('lt-image-wrapper')
      wrapper.style.display = 'inline-block'
      wrapper.style.position = 'relative'
      wrapper.style.lineHeight = '0'

      const img = document.createElement('img')
      img.classList.add('lt-resizable-image')
      img.src = node.attrs.src || ''
      if (node.attrs.alt) img.alt = node.attrs.alt
      if (node.attrs.title) img.title = node.attrs.title
      if (node.attrs.width) img.style.width = node.attrs.width + 'px'
      if (node.attrs.height) img.style.height = node.attrs.height + 'px'
      img.style.maxWidth = '100%'
      wrapper.appendChild(img)

      // --- 四角拖拽手柄 ---
      const corners = ['nw', 'ne', 'sw', 'se']
      const handles = []
      corners.forEach((pos) => {
        const h = document.createElement('div')
        h.classList.add('lt-resize-handle', 'lt-resize-' + pos)
        h.style.position = 'absolute'
        h.style.width = '10px'
        h.style.height = '10px'
        h.style.background = '#4a90d9'
        h.style.border = '1px solid #fff'
        h.style.borderRadius = '50%'
        h.style.cursor = pos === 'nw' || pos === 'se' ? 'nwse-resize' : 'nesw-resize'
        h.style.zIndex = '10'
        if (pos === 'nw') { h.style.top = '-5px'; h.style.left = '-5px' }
        else if (pos === 'ne') { h.style.top = '-5px'; h.style.right = '-5px' }
        else if (pos === 'sw') { h.style.bottom = '-5px'; h.style.left = '-5px' }
        else { h.style.bottom = '-5px'; h.style.right = '-5px' }
        h.style.display = 'none'
        wrapper.appendChild(h)
        handles.push({ el: h, pos })
      })

      wrapper.addEventListener('mouseenter', () => handles.forEach((h) => (h.el.style.display = 'block')))
      wrapper.addEventListener('mouseleave', () => handles.forEach((h) => (h.el.style.display = 'none')))

      // --- 拖拽逻辑 ---
      handles.forEach(({ el, pos }) => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()
          const startX = e.clientX
          const startY = e.clientY
          const startW = img.offsetWidth
          const startH = img.offsetHeight
          const ratio = startW / startH
          const docMove = (ev) => {
            let dx = ev.clientX - startX
            let dy = ev.clientY - startY
            let newW = startW, newH = startH
            if (pos === 'se') { newW = Math.max(30, startW + dx); newH = Math.max(30, startH + dy) }
            else if (pos === 'sw') { newW = Math.max(30, startW - dx); newH = Math.max(30, startH + dy) }
            else if (pos === 'ne') { newW = Math.max(30, startW + dx); newH = Math.max(30, startH - dy) }
            else { newW = Math.max(30, startW - dx); newH = Math.max(30, startH - dy) }
            // 保持宽高比
            if (ev.shiftKey) { newH = Math.round(newW / ratio) }
            img.style.width = newW + 'px'
            img.style.height = newH + 'px'
          }
          const docUp = () => {
            document.removeEventListener('mousemove', docMove)
            document.removeEventListener('mouseup', docUp)
            // 更新节点属性
            if (typeof getPos === 'function') {
              const pos = getPos()
              editor
                .chain()
                .focus()
                .setNodeSelection(pos)
                .updateAttributes('resizableImage', { width: img.offsetWidth, height: img.offsetHeight })
                .run()
            }
          }
          document.addEventListener('mousemove', docMove)
          document.addEventListener('mouseup', docUp)
        })
      })

      return {
        dom: wrapper,
        update(p) { return false },
        ignoreMutation(p) { return true },
      }
    }
  },
})
