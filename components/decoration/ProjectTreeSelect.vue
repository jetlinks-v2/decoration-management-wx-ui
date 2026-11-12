<script setup lang="ts">
import {computed} from 'vue'
import SelectField from '../../mobile/components/ui/SelectField.vue'
import {isSelectableProject,type ProjectTreeNode} from '../../utils/decoration'
const props=withDefaults(defineProps<{value?:string;treeData:ProjectTreeNode[];placeholder?:string;disabled?:boolean;allowClear?:boolean}>(),{allowClear:true})
const emit=defineEmits<{'update:value':[value:string|undefined]}>()
function flatten(rows:ProjectTreeNode[],prefix=''): {label:string;value:string;disabled:boolean}[]{return rows.flatMap(row=>[{label:prefix+row.title,value:row.value,disabled:!isSelectableProject(props.treeData,row.value)},...flatten(row.children||[],prefix+'　')])}
const options=computed(()=>flatten(props.treeData))
function update(value:string|undefined){if(!props.disabled&&(value===undefined&&props.allowClear||value!==undefined&&isSelectableProject(props.treeData,value)))emit('update:value',value)}
</script>
<template><SelectField :model-value="value" :options="options" :placeholder="placeholder" :disabled="disabled" :clearable="allowClear" @update:model-value="update" /></template>
