<template>
  <div class="lt-tree-item" :class="{ 'lt-tree-item-active': isActive }">
    <div
      class="lt-tree-item-row"
      :style="{ background: node.color ? hexToRgba(node.color, 0.15) : '' }"
      :draggable="true"
      @dragstart="onDragStart"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragend="onDragEnd"
      @contextmenu.prevent="onContextMenu"
      @click="onSelect"
      @dblclick="startRename"
    >
      <span class="lt-tree-arrow" @click.stop="toggleExpand">
        <template v-if="hasChildren">
          <span v-if="expanded">▼</span>
          <span v-else>▶</span>
        </template>
        <span v-else class="lt-tree-arrow-placeholder"></span>
      </span>
      <span class="lt-tree-icon" v-if="node.icon">{{ node.icon }}</span>
      <span class="lt-tree-name" v-if="!renaming">{{ node.name }}</span>
      <input
        v-else
        ref="renameInput"
        class="lt-tree-rename-input"
        :value="node.name"
        @blur="commitRename"
        @keydown.enter="commitRename"
        @keydown.escape="cancelRename"
        @click.stop
        @contextmenu.stop
      />
      <span class="lt-tree-timestamp" v-if="node.created_at">{{ formatTime(node.created_at) }}</span>
    </div>
    <div v-if="expanded && hasChildren" class="lt-tree-children">
      <TreeItem
        v-for="child in children"
        :key="child.id"
        :node="child"
        :allNodes="allNodes"
        :activeId="activeId"
        :expandedSet="expandedSet"
        @select="$emit('select', $event)"
        @toggle-expand="$emit('toggle-expand', $event)"
        @rename="$emit('rename', $event)"
        @context-menu="$emit('context-menu', $event)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end')"
        @drop-node="$emit('drop-node', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  allNodes: { type: Array, required: true },
  activeId: { type: [Number, null], default: null },
  expandedSet: { type: Set, required: true },
})

const emit = defineEmits([
  'select', 'toggle-expand', 'rename', 'context-menu',
  'drag-start', 'drag-end', 'drop-node',
])

const renaming = ref(false)
const renameInput = ref(null)

const children = computed(() =>
  props.allNodes.filter((n) => n.parent_id === props.node.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
)

const hasChildren = computed(() => children.value.length > 0)
const expanded = computed(() => props.expandedSet.has(props.node.id))
const isActive = computed(() => props.activeId === props.node.id)

function hexToRgba(hex, alpha) {
  if (!hex) return ''
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function formatTime(ts) {
  if (!ts) return ''
  // 只显示日期部分 YYYY-MM-DD
  if (ts.length >= 10) return ts.substring(0, 10)
  return ts
}

function onSelect() {
  if (renaming.value) return
  emit('select', props.node)
}

function toggleExpand() {
  emit('toggle-expand', props.node.id)
}

function startRename() {
  renaming.value = true
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus()
      renameInput.value.select()
    }
  })
}

function commitRename(e) {
  const newName = e.target.value.trim()
  renaming.value = false
  if (newName && newName !== props.node.name) {
    emit('rename', { id: props.node.id, name: newName })
  }
}

function cancelRename() {
  renaming.value = false
}

function onContextMenu(e) {
  emit('context-menu', { event: e, node: props.node })
}

function onDragStart(e) {
  e.dataTransfer.setData('text/plain', String(props.node.id))
  e.dataTransfer.effectAllowed = 'move'
  emit('drag-start', props.node)
}

function onDragOver(e) {
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(e) {
  const draggedId = e.dataTransfer.getData('text/plain')
  if (draggedId) {
    emit('drop-node', { draggedId: parseInt(draggedId), targetId: props.node.id })
  }
}

function onDragEnd() {
  emit('drag-end')
}
</script>
