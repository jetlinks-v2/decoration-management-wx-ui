import type { Method, SessionContext, Transport } from '../types/decoration'
import { identity, validateContext, validatePath, SessionError } from './session'
import { mobilePermissions, type AuthorizedMenu } from '../utils/mobileEntry'
import { inShell, shellRequest, shellApplication, shellEnvironment } from './shell/runtime'
export interface DecorationHost {
  context(): Promise<SessionContext>
  request<T>(input: {path:string;method:Method;body?:unknown;signal?:AbortSignal;responseType?:'blob'}): Promise<T>
  back?(): void | Promise<void>
  permissions?(): Promise<Record<string,boolean>>
  confirmDiscard?(): Promise<boolean>
}
declare global { interface Window { decorationHost?: DecorationHost } }
let standalone: DecorationHost | undefined
let shellIdentity: {userId:string;applicationId:string;tenantId:string} | undefined
let initial = '', businessProject: string | undefined, invalidated = false
const active = new Set<AbortController>()
export function setStandaloneHost(value:DecorationHost) { standalone = value }
export function setShellIdentity(value:typeof shellIdentity) { cancelRequests(); initial=''; businessProject=undefined; invalidated=false; shellIdentity=value }
export function cancelRequests() { active.forEach(controller=>controller.abort()); active.clear() }
function changed():never { invalidated=true; cancelRequests(); window.dispatchEvent(new Event('decoration:session-expired')); throw new SessionError(401,'登录身份已变化，请重新进入装修办理') }
function independent() { const value=standalone||window.decorationHost; if(!value)throw new SessionError(401,'请先登录装修应用'); return value }
export const host: DecorationHost = {
  async context() {
    if(!inShell())return independent().context()
    if(!shellIdentity||shellIdentity.applicationId!==shellApplication()?.id||shellIdentity.tenantId!==shellEnvironment())changed()
    return {...shellIdentity!,sessionEntryCode:'decoration-shell'}
  },
  async request<T>(input:{path:string;method:Method;body?:unknown;signal?:AbortSignal;responseType?:'blob'}):Promise<T> {
    return inShell()?shellRequest<T>(input.path,{method:input.method,body:input.body,signal:input.signal,responseType:input.responseType}):independent().request<T>(input)
  },
  async permissions() {
    if(!inShell())return independent().permissions?.()||{}
    const menus=await shellRequest<AuthorizedMenu[]>('/menu/user-own/tree',{method:'POST',body:{paging:false,terms:[{column:'owner',value:'app'}],sorts:[{name:'sortIndex',order:'asc'}]}})
    if(!Array.isArray(menus))throw new SessionError(502,'无法读取当前账号的装修操作授权')
    return mobilePermissions(menus)
  },
  back() { if(!inShell())return independent().back?.() },
}
export async function resolveContext() {
  if(invalidated)changed()
  const context=validateContext(await host.context()),key=identity(context)
  if(initial&&initial!==key)changed()
  if(initial&&businessProject!==context.businessProjectId) { cancelRequests(); window.dispatchEvent(new CustomEvent('decoration:project-changed',{detail:context.businessProjectId||''})) }
  initial=key; businessProject=context.businessProjectId; return context
}
export const transport: Transport = async<T>(path:string,method:Method,body?:unknown,signal?:AbortSignal,responseType?:'blob'):Promise<T> => {
  validatePath(path); const before=identity(await resolveContext()),controller=new AbortController(); active.add(controller)
  const abort=()=>controller.abort(); signal?.addEventListener('abort',abort,{once:true}); if(signal?.aborted)abort()
  try {
    const result=await host.request<T>({path,method,body,signal:controller.signal,responseType})
    controller.signal.throwIfAborted()
    if(before!==identity(await resolveContext()))changed()
    return result
  } finally {signal?.removeEventListener('abort',abort);active.delete(controller)}
}
