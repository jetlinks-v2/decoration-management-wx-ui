<script setup lang="ts">
import { Button as VanButton } from 'vant'
import type {MobileSide} from '../../utils/mobileEntry'
defineProps<{roles:MobileSide[]}>()
const emit=defineEmits<{choose:[side:MobileSide]}>()
const options={owner:{title:'业主服务',description:'装修申请、进度查询与整改办理'},staff:{title:'员工工作台',description:'巡检验收、整改复核与任务办理'}}
</script>
<template>
 <section class="identity-chooser"><h1>选择装修身份</h1><p>请选择本次办理使用的身份</p>
  <van-button v-for="role in roles" :key="role" block plain class="identity-option" @click="emit('choose',role)"><span><strong>{{options[role].title}}</strong><small>{{options[role].description}}</small></span><span aria-hidden="true">›</span></van-button>
 </section>
</template>
<style scoped>
.identity-chooser{max-width:600px;min-height:70vh;margin:auto;padding:56px 24px;background:linear-gradient(160deg,#edf5ff,#f7f9fc);box-sizing:border-box}.identity-chooser h1{font-size:24px;color:#1d3552;margin:0 0 8px}.identity-chooser p{color:#6d7f93;margin-bottom:32px}.identity-option{height:auto;padding:24px 20px;border:1px solid #e1eaf6;border-radius:16px;margin-bottom:18px;text-align:left;color:#1e63bd;background:#fff}.identity-option :deep(.van-button__text){display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px}.identity-option strong{display:block;font-size:18px}.identity-option small{display:block;margin-top:8px;font-size:13px;color:#758397;line-height:1.6}
</style>
