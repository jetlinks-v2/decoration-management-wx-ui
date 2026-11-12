<script setup lang="ts" generic="T extends object">
import {Cell as VanCell,CellGroup as VanCellGroup,Empty as VanEmpty} from 'vant'
import {Comment,Text,isVNode,type VNode} from 'vue'
interface Column {title?:string;key?:string;dataIndex?:string}
const props=defineProps<{dataSource:T[];columns:Column[];rowKey?:string|((row:T,index:number)=>string|number)}>()
const slots=defineSlots<{bodyCell?(props:{column:Column;record:T;index:number}):VNode[];emptyText?():VNode[]}>()
function content(column:Column,record:T,index:number){
 const nodes=slots.bodyCell?.({column,record,index})
 const visible=(rows:VNode[]):boolean=>rows.some(node=>node.type!==Comment&&(node.type!==Text||String(node.children||'').trim())&&(Array.isArray(node.children)?visible(node.children.filter(isVNode)):true))
 return nodes&&visible(nodes)?nodes:String(column.dataIndex?record[column.dataIndex as keyof T]??'—':'—')
}
const key=(row:T,index:number)=>typeof props.rowKey==='function'?props.rowKey(row,index):String(row[(props.rowKey||'id') as keyof T]??index)
</script>
<template><div class="mobile-record-list"><van-cell-group v-for="(record,index) in dataSource" :key="key(record,index)" inset class="mobile-record"><van-cell v-for="(column,i) in columns" :key="column.key||column.dataIndex||i" :title="column.title"><template #value><component :is="{render:()=>content(column,record,index)}" /></template></van-cell></van-cell-group><slot v-if="!dataSource.length" name="emptyText"><van-empty description="暂无记录" /></slot></div></template>
