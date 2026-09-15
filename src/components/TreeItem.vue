<template>
  <div class="tree-item">
    <div class="tree-item-label" :class="{ active: selectedId === node.id, 'drag-over': isDragOver }"
      :style="{ paddingLeft: level * 18 + 8 + 'px' }" draggable="true"
      @click="$emit('select', node)" @dblclick="startRename" @contextmenu.prevent="showMenu"
      @dragstart="onDragStart" @dragover.prevent="onDragOver" @dragleave="isDragOver = false" @drop.prevent="onDrop" @dragend="isDragOver = false">
      <span class="expand-toggle" v-if="hasChildren" @click.stop="$emit('toggle', node.id)">{{ isExpanded ? '▼' : '▶' }}</span>
      <span class="expand-spacer" v-else></span>
      <span class="node-icon">{{ node.icon || '📄' }}</span>
      <input v-if="renaming" v-model="renVal" class="rename-input" ref="renInput"
        @blur="commitRename" @keyup.enter="commitRename" @keyup.esc="renaming = false" @click.stop />
      <span v-else class="node-name">{{ node.name }}</span>
      <span v-if="node.created_at && !renaming" class="node-timestamp" :title="'创建: ' + node.created_at">{{ fmtTs(node.created_at) }}</span>
    </div>
    <div v-show="isExpanded && hasChildren">
      <TreeItem v-for="c in children" :key="c.id" :node="c" :all-nodes="allNodes"
        :selected-id="selectedId" :level="level + 1" :expanded-set="expandedSet"
        @select="$emit('select', $event)" @delete="$emit('delete', $event)" @rename="$emit('rename', $event)"
        @toggle="$emit('toggle', $event)" @move="$emit('move', $event)" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted } from 'vue'
const props = defineProps({ node: Object, allNodes: Array, selectedId: [Number, null], level: Number, expandedSet: Set })
const emit = defineEmits(['select', 'delete', 'rename', 'toggle', 'move'])
const renaming = ref(false); const renVal = ref(''); const renInput = ref(null); const isDragOver = ref(false)
const children = computed(() => props.allNodes.filter(n => n.parent_id === props.node.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
const hasChildren = computed(() => children.value.length > 0)
const isExpanded = computed(() => props.expandedSet.has(props.node.id))
function startRename() { renaming.value = true; renVal.value = props.node.name; nextTick(() => { renInput.value?.focus(); renInput.value?.select() }) }
function commitRename() { if (renVal.value.trim() && renVal.value.trim() !== props.node.name) emit('rename', { id: props.node.id, name: renVal.value.trim() }); renaming.value = false }
function showMenu(e) { emit('select', props.node); window.dispatchEvent(new CustomEvent('tree-context-menu', { detail: { x: e.clientX, y: e.clientY, nodeId: props.node.id } })) }
function fmtTs(ts) { if (!ts) return ''; try { const p = ts.split(' '); const d = (p[0] || '').substring(5).replace('-', '/'); const t = (p[1] || '').substring(0, 5); return d + ' ' + t } catch { return ts } }
let dragData = null
function onDragStart(e) { dragData = props.node.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(props.node.id)) }
function onDragOver(e) { if (dragData && dragData !== props.node.id) { isDragOver.value = true; e.dataTransfer.dropEffect = 'move' } }
function onDrop(e) { isDragOver.value = false; if (!dragData || dragData === props.node.id) return; emit('move', { id: dragData, parentId: props.node.id, sortOrder: children.value.length }); if (!props.expandedSet.has(props.node.id)) emit('toggle', props.node.id); dragData = null }
onMounted(() => { window.addEventListener('tree-rename', (e) => { if (e.detail && e.detail.id === props.node.id) startRename() }) })
</script>
