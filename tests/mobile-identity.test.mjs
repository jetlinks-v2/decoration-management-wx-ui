import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {createRenderer,defineComponent,h,nextTick} from 'vue'
const result=await build({entryPoints:[fileURLToPath(new URL('../mobile/useDecorationIdentity.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],plugins:[{name:'identity-host',setup(builder){
 builder.onResolve({filter:/^\.\/transport$/},()=>({path:'transport',namespace:'host'}))
 builder.onLoad({filter:/.*/,namespace:'host'},()=>({contents:`export const resolveContext=()=>globalThis.__identityHost.context(); export const transport=(...args)=>globalThis.__identityHost.request(...args); export const cancelRequests=()=>globalThis.__identityHost.cancel()`}))
}}]})
const loaded={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports)
const {chooseDecorationSide,useDecorationIdentity}=loaded.exports
const flush=async()=>{await nextTick();await new Promise(resolve=>setImmediate(resolve));await nextTick()}
function mount(source,preferred){
 globalThis.__identityHost=source
 const renderer=createRenderer({createElement:()=>({}),createText:()=>({}),createComment:()=>({}),insert(){},remove(){},setText(){},setElementText(){},patchProp(){},parentNode(){},nextSibling(){}})
 let state;const app=renderer.createApp(defineComponent({setup(){state=useDecorationIdentity(preferred);return()=>h('div')}}));app.mount({})
 return {state,stop:()=>app.unmount()}
}
function host(identity){return {context:async()=>({}),request:async()=>identity,cancel(){}}}
test('单身份直达、双身份选择，URL偏好只能选择已有身份',()=>{
 assert.equal(chooseDecorationSide({owner:true,staff:false}),'owner')
 assert.equal(chooseDecorationSide({owner:false,staff:true}),'staff')
 assert.equal(chooseDecorationSide({owner:true,staff:true}),undefined)
 assert.equal(chooseDecorationSide({owner:true,staff:true},'staff'),'staff')
 assert.equal(chooseDecorationSide({owner:true,staff:false},'staff'),'owner')
 assert.equal(chooseDecorationSide({owner:false,staff:false}),undefined)
})
test('双身份切换取消旧业务请求，不能选择未授权端别',async()=>{
 let cancelled=0;const source=host({owner:true,staff:true});source.cancel=()=>cancelled++
 const view=mount(source)
 try{await flush();assert.deepEqual(view.state.roles.value,['owner','staff']);assert.equal(view.state.selected.value,undefined)
 view.state.choose('staff');assert.equal(view.state.selected.value,'staff');view.state.switchIdentity();assert.equal(cancelled,1);assert.equal(view.state.selected.value,undefined)
 source.request=async()=>({owner:true,staff:false});await view.state.load();view.state.choose('staff');assert.equal(view.state.selected.value,'owner')
 }finally{view.stop()}
})
test('目录失败可重试、空身份不能进入；迟到结果和卸载不会覆盖身份',async()=>{
 const source=host();source.request=async()=>{throw new Error('目录不可用')};const view=mount(source)
 try{await flush();assert.match(view.state.error.value,/目录不可用/);assert.equal(view.state.selected.value,undefined)
 source.request=async()=>({owner:false,staff:false});await view.state.load();assert.match(view.state.error.value,/暂无可用/)
 let release,signal;source.request=async(path,method,body,requestSignal)=>{signal=requestSignal;return new Promise(resolve=>release=resolve)}
 const old=view.state.load();await flush();source.request=async()=>({owner:false,staff:true});await view.state.load();assert.equal(signal.aborted,true)
 release({owner:true,staff:false});await old;assert.equal(view.state.selected.value,'staff')
 source.request=async()=>new Promise(resolve=>release=resolve);const late=view.state.load();await flush();view.stop();release({owner:true,staff:true});await late;assert.deepEqual(view.state.roles.value,[])
 }finally{view.stop()}
})
