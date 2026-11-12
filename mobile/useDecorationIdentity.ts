import { onMounted, onScopeDispose, ref } from 'vue'
import { transport, resolveContext, cancelRequests } from './transport'
import { errorText } from '../utils/decoration'
import type { MobileSide } from '../utils/mobileEntry'
export interface DecorationIdentity { owner:boolean; staff:boolean }
/** 身份来自服务端当前应用核验，入口只作为已授权身份的偏好，不扩大访问范围。 */
export function chooseDecorationSide(identity:DecorationIdentity,preferred?:MobileSide):MobileSide|undefined {
 if(preferred&&identity[preferred]===true)return preferred
 const available=(['owner','staff'] as const).filter(side=>identity[side]===true)
 return available.length===1?available[0]:undefined
}
export function useDecorationIdentity(preferred?:MobileSide){
 const roles=ref<MobileSide[]>([]),selected=ref<MobileSide>(),loading=ref(false),error=ref('')
 let revision=0,disposed=false,controller:AbortController|undefined
 async function load(){
  const own=++revision;controller?.abort();const request=new AbortController();controller=request
  roles.value=[];selected.value=undefined;loading.value=true;error.value=''
  try{
   await resolveContext()
   if(disposed||own!==revision||request.signal.aborted)return
   const result=await transport<DecorationIdentity>('/decoration/mobile/identity','GET',undefined,request.signal)
   if(disposed||own!==revision)return
   roles.value=(['owner','staff'] as const).filter(side=>result?.[side]===true)
   if(!roles.value.length)throw new Error('当前账号暂无可用的装修身份，请联系物业核对员工档案、业主房屋关联及应用授权。')
   selected.value=chooseDecorationSide(result,preferred)
  }catch(cause){if(!disposed&&own===revision)error.value=errorText(cause)}
  finally{if(!disposed&&own===revision)loading.value=false}
 }
 function choose(side:MobileSide){if(!loading.value&&roles.value.includes(side))selected.value=side}
 function switchIdentity(){cancelRequests();selected.value=undefined}
 onMounted(()=>void load())
 onScopeDispose(()=>{disposed=true;revision++;controller?.abort()})
 return {roles,selected,loading,error,load,choose,switchIdentity}
}
