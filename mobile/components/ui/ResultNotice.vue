<script setup lang="ts">
import {Empty as VanEmpty} from 'vant'
defineProps<{title?:string;subTitle?:string}>()
</script>
<template><van-empty :description="title"><p>{{subTitle}}</p><slot /><slot name="extra" /></van-empty></template>
