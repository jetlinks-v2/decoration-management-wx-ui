<script setup lang="ts">
import {NoticeBar as VanNoticeBar,Toast as VanToast} from 'vant'
import {computed,inject,onMounted,ref,watch} from 'vue'
defineOptions({inheritAttrs:false})
const props=defineProps<{message:string;type?:string;floating?:boolean;inline?:boolean}>()
const emit=defineEmits<{'update:message':[message:string]}>()
const popupTarget=inject<HTMLElement|string>('business-popup-target','body')
// 操作错误浮层展示；流程状态沿用内嵌提示。致命加载错误可同时保留页面说明。
const feedback=computed(()=>props.floating||props.type==='error')
const visible=ref(false)
const refresh=()=>{visible.value=!!props.message&&feedback.value}
watch(()=>[props.message,feedback.value],refresh)
// 挂载后开启，确保 Toast 从隐藏切为显示并启动自动关闭计时。
onMounted(refresh)
function dismiss(show:boolean){
 visible.value=show
 // 仅双向绑定的即时反馈会清空错误，允许再次操作时弹出相同的校验提示。
 if(!show)emit('update:message','')
}
</script>
<template>
 <van-toast v-if="feedback" :show="visible" :message="message" :teleport="popupTarget" position="middle" :duration="6000" :z-index="10000" close-on-click class="mobile-notice-toast" :style="{'--van-toast-max-width':'calc(100% - 48px)'}" @update:show="dismiss">
  <template #message><div role="alert" aria-live="assertive">{{message}}</div><div v-if="!inline&&($slots.action||$slots.default)" class="mobile-notice-actions" @click.stop><slot/><slot name="action"/></div></template>
 </van-toast>
 <div v-if="!feedback||inline" v-bind="$attrs" class="mobile-notice" :role="type==='error'?'alert':'status'"><van-notice-bar wrapable :text="message" :color="type==='error'?'#b42318':undefined" :background="type==='error'?'#fff1f0':undefined"/><slot/><slot name="action"/></div>
</template>
<style scoped>
.mobile-notice-toast{width:max-content;max-width:calc(100% - 48px);box-sizing:border-box}
.mobile-notice-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:12px}
.mobile-notice-actions :deep(.van-button){height:32px;font-size:13px}
</style>
