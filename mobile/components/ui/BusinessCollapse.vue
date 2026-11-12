<script setup lang="ts">
import {ref} from 'vue'
import {Collapse as VanCollapse} from 'vant'
const active=ref<(string|number)[]>([])
</script>
<template><van-collapse v-model="active"><slot /></van-collapse></template>
