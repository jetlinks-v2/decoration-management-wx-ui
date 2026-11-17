<script setup lang="ts">
import {ref} from 'vue'
import {Button as VanButton} from 'vant'
import App from './App.vue'
import MobileNotice from './components/ui/MobileNotice.vue'
import MobileLoading from './components/ui/MobileLoading.vue'
import IdentityChooser from './components/IdentityChooser.vue'
import {useDecorationIdentity} from './useDecorationIdentity'
import type {MobileSide} from '../utils/mobileEntry'
const props=defineProps<{standalone?:boolean;loggingOut?:boolean;side?:MobileSide;entrySearch?:string}>()
const emit=defineEmits<{logout:[]}>()
const query=new URLSearchParams(props.entrySearch??location.search).get('side')
const preferred=props.side||(query==='owner'||query==='staff'?query:undefined)
const {roles,selected,loading,error,load,choose,switchIdentity}=useDecorationIdentity(preferred)
const app=ref<{canLeave:()=>Promise<boolean>}>()
async function switchSide(){if(await app.value?.canLeave())switchIdentity()}
</script>
<template>
 <MobileLoading v-if="loading" text="正在识别装修身份" />
 <section v-else-if="error" class="identity-error"><MobileNotice type="error" inline :message="error" /><van-button @click="load">重新加载</van-button><van-button v-if="standalone" @click="emit('logout')">退出登录</van-button></section>
 <template v-else-if="selected">
  <App :key="selected" ref="app" :side="selected" :entry-search="entrySearch" :standalone="standalone" :logging-out="loggingOut" @logout="emit('logout')">
   <template v-if="roles.length>1" #identity><div class="identity-toolbar"><span>当前身份：{{selected==='owner'?'业主':'员工'}}</span><van-button plain size="small" @click="switchSide">切换身份</van-button></div></template>
  </App>
 </template>
 <IdentityChooser v-else :roles="roles" @choose="choose" />
</template>
<style scoped>
.identity-error{max-width:600px;padding:24px;margin:auto}.identity-error .van-button{margin-top:16px;margin-right:12px}.identity-toolbar{max-width:600px;margin:auto;display:flex;justify-content:space-between;align-items:center;box-sizing:border-box;padding:6px 16px;background:#f0f6ff;font-size:12px;color:#526b89}.identity-toolbar .van-button{border:0;color:#216acf;background:transparent}
</style>
