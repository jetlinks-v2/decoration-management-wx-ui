import { inject, onScopeDispose, unref, type ComputedRef } from 'vue'
import { closeDialog, showConfirmDialog } from 'vant'
export function useDiscardConfirm(message:()=>string) {
  const teleport=inject<HTMLElement|string|ComputedRef<HTMLElement|string>>('business-popup-target','body')
  let pending=false,disposed=false
  onScopeDispose(()=>{disposed=true;if(pending)closeDialog()})
  return async()=>{
    if(pending||disposed)return false
    pending=true
    try{await showConfirmDialog({title:message(),confirmButtonText:'放弃修改',cancelButtonText:'继续填写',teleport:unref(teleport)});return !disposed}
    catch{return false}finally{pending=false}
  }
}
