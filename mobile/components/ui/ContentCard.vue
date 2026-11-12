<script setup lang="ts">
import {CellGroup as VanCellGroup} from 'vant'
defineProps<{title?:string}>()
</script>
<template><van-cell-group :title="title" class="content-card"><slot /></van-cell-group></template>
