import {mobileMessages} from './messages'
import {authState,sessionRequest} from './auth/session'
import {SessionError} from './session'
import {mobilePermissions,type AuthorizedMenu} from '../utils/mobileEntry'
import {setStandaloneHost,type DecorationHost} from './transport'
const standalone:DecorationHost=window.decorationHost||{
 async context(){
  const session=authState.session,me=authState.authorization
  if(!session||!me?.user?.id)throw new SessionError(401,'请先登录装修应用')
  return {userId:me.user.id,applicationId:session.applicationId,sessionEntryCode:'decoration-h5',tenantId:session.tenantDomain}
 },
 async request(input){try{return await sessionRequest(input.path,input.method,input.body,{signal:input.signal,responseType:input.responseType})}catch(error){if(error instanceof SessionError&&error.message.startsWith('Mobile.'))error.message=mobileMessages[error.message.slice(7) as keyof typeof mobileMessages]||error.message;throw error}},
 async permissions(){
  const menus=await sessionRequest<AuthorizedMenu[]>('/menu/user-own/tree','POST',{paging:false,terms:[{column:'owner',value:'app'}],sorts:[{name:'sortIndex',order:'asc'}]})
  if(!Array.isArray(menus))throw new SessionError(502,'无法读取当前账号的装修操作授权')
  return mobilePermissions(menus)
 }
}

export function installStandaloneHost(){setStandaloneHost(standalone)}
