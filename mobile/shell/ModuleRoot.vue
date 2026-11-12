<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { ConfigProvider as VanConfigProvider } from 'vant'
import MobileLoading from '../components/ui/MobileLoading.vue'

import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMobileAppContext } from '@jetlinks-mobile-core'
import { jetlinksMobile } from '../../package.json'
import BusinessApp from '../BusinessEntry.vue'
import { bindShell, shellRequest, shellState } from './runtime'
import { setShellIdentity } from '../transport'
import { provideDecorationI18n } from '../i18n'
import { mountBusinessStyles } from './styles'
import businessCss from '../style.css?inline'
import sharedCss from '../../components/decoration/decoration.css?inline'
import mobileCss from '../components/ui/mobile.css?inline'
const context=useMobileAppContext(),route=useRoute(),root=ref<HTMLElement>(),ready=ref(false),error=ref(''),generation=ref(0)
const side=computed(()=>route.path.endsWith('/staff')||route.query.side==='staff'?'staff':route.path.endsWith('/owner')||route.query.side==='owner'?'owner':undefined)
// 宿主通知使用模块路由 query，不读取外层浏览器 URL 的登录或租户参数。
const entrySearch=computed(()=>{
 const query=new URLSearchParams()
 if(side.value)query.set('side',side.value)
 for(const key of ['decorationId','taskId','step']){const value=route.query[key];if(typeof value==='string')query.set(key,value)}
 return query.toString()
})
provideDecorationI18n()
provide('business-popup-target',computed(()=>root.value||'body'))
let dispose=()=>{},removeStyles=()=>{},attempt=0
async function start() {
  const own=++attempt; ready.value=false; error.value=''; dispose(); setShellIdentity(undefined)
  dispose=bindShell(context,jetlinksMobile.templateCodes)
  if(shellState.error)return
  try {
    const me=await shellRequest<{user:{id:string};permissions?:{id:string;actions:string[]}[]}>('/authorize/me')
    if(own!==attempt)return
    if(!me?.user?.id)throw new Error('应用授权未返回有效身份')
    if(!me.permissions?.some(permission=>['decoration-task','decoration-owner'].includes(permission.id)&&permission.actions.includes('query')))throw new Error('当前账号没有此装修端的访问权限')
    setShellIdentity({userId:me.user.id,applicationId:context.application.value!.id,tenantId:context.project.value!.code})
    generation.value++; ready.value=true
  } catch(cause) {if(own===attempt)error.value=cause instanceof Error?cause.message:'应用加载失败'}
}
watch(()=>[context.project.value?.code,context.application.value?.id,context.application.value?.templateCode,side.value,entrySearch.value],()=>{void start()},{flush:'sync'})
onMounted(()=>{removeStyles=mountBusinessStyles([mobileCss,businessCss,sharedCss],'decoration-business');void start()})
onBeforeUnmount(()=>{attempt++;dispose();setShellIdentity(undefined);removeStyles()})

</script>
<template>
  <section ref="root" class="decoration-business official-module" style="--h5-app-safe-top:0px;--h5-app-safe-bottom:env(safe-area-inset-bottom,0px)">
    <van-config-provider>
      <van-empty v-if="error||shellState.error" :description="error||shellState.error"><van-button v-if="!shellState.error" @click="start">重新加载</van-button></van-empty>
      <BusinessApp v-else-if="ready" :key="generation" :side="side" :entry-search="entrySearch" />
      <MobileLoading v-else text="正在连接应用"><div style="height:80px" /></MobileLoading>
    </van-config-provider>
  </section>
</template>

<style scoped>
.official-module :deep(.decoration-mobile){min-height:0;max-width:none}
</style>
