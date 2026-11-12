<script setup lang="ts">
import {Cell as VanCell} from 'vant'
defineProps<{label?:string}>()
</script>
<template><van-cell :title="label" class="detail-field"><template #value><slot /></template></van-cell></template>
