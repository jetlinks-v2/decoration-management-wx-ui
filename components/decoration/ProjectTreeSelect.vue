<script setup lang="ts">
import {computed} from 'vue'
import SelectField from '../../mobile/components/ui/SelectField.vue'
import type {Option} from '../../mobile/components/ui/selection'
import {isSelectableProject,type ProjectTreeNode} from '../../utils/decoration'
const props=withDefaults(defineProps<{value?:string;treeData:ProjectTreeNode[];placeholder?:string;disabled?:boolean;allowClear?:boolean}>(),{allowClear:true})
const emit=defineEmits<{'update:value':[value:string|undefined]}>()
// Preserve ancestors for path search without making non-project organizations selectable.
function choices(rows:ProjectTreeNode[]):Option[]{return rows.map(row=>({label:row.title,value:row.value,disabled:!isSelectableProject(props.treeData,row.value),children:choices(row.children||[])}))}
const options=computed(()=>choices(props.treeData))
function update(value:string|undefined){if(!props.disabled&&(value===undefined&&props.allowClear||value!==undefined&&isSelectableProject(props.treeData,value)))emit('update:value',value)}
</script>
<template><SelectField :model-value="value" :options="options" :placeholder="placeholder" :disabled="disabled" :clearable="allowClear" @update:model-value="update" /></template>
