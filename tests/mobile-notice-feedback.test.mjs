import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {parse,compileScript} from 'vue/compiler-sfc'
import {createRenderer,defineComponent,h,nextTick,provide,reactive,ref} from 'vue'
import {test} from 'node:test'
import assert from 'node:assert/strict'
const filename=fileURLToPath(new URL('../mobile/components/ui/MobileNotice.vue',import.meta.url))
const {descriptor}=parse(readFileSync(filename,'utf8'),{filename})
const result=await build({stdin:{contents:compileScript(descriptor,{id:'notice-test',inlineTemplate:true}).content,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],plugins:[{name:'vant-controls',setup(builder){
 builder.onResolve({filter:/^vant$/},()=>({path:'vant',namespace:'controls'}))
 builder.onLoad({filter:/.*/,namespace:'controls'},()=>({contents:`import {h} from 'vue';export const Toast={inheritAttrs:false,setup:(_,ctx)=>()=>h('toast',ctx.attrs,ctx.slots.message?.())},NoticeBar={inheritAttrs:false,setup:(_,ctx)=>()=>h('notice',ctx.attrs)};`}))
}}]})
const loaded={exports:{}}
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports)
const renderer=createRenderer({
 createElement:type=>({type,children:[],props:{}}),createText:text=>({text}),createComment:()=>({}),setText(n,t){n.text=t},setElementText(n,t){n.text=t;n.children=[]},patchProp(n,k,_,v){n.props[k]=v},parentNode:n=>n.parent,nextSibling:n=>n.parent?.children[n.parent.children.indexOf(n)+1]??null,
 insert(n,p,a){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);const i=a?p.children.indexOf(a):-1;p.children.splice(i<0?p.children.length:i,0,n);n.parent=p},remove(n){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);n.parent=undefined}
})
function mount(options,{bound=false,action=false}={}){
 const props=reactive(options),root={children:[]},target={id:'business'},app=renderer.createApp(defineComponent({setup(){provide('business-popup-target',ref(target));return()=>h(loaded.exports.default,{...props,...bound?{'onUpdate:message':message=>props.message=message}:{}},action?{action:()=>h('button','重试')}:undefined)}}))
 app.mount(root)
 const find=(p,n=root)=>p(n)?n:(n.children||[]).map(c=>find(p,c)).find(Boolean)
 return {props,target,find,stop:()=>app.unmount()}
}
test('操作错误立即浮层展示，限制在业务弹层容器且不阻止页面操作',async t=>{
 const v=mount({message:'网络连接失败',type:'error'});t.after(v.stop);await nextTick()
 const toast=v.find(n=>n.type==='toast');assert.equal(toast.props.show,true);assert.equal(toast.props.message,'网络连接失败');assert.equal(toast.props.teleport.id,v.target.id)
 assert.equal(toast.props.position,'middle');assert.equal(toast.props.duration,6000);assert.equal(toast.props.forbidClick,undefined)
 assert.equal(v.find(n=>n.type==='notice'),undefined)
})
test('关闭校验提示后重复操作仍能提示相同文案',async t=>{
 const v=mount({message:'请签署装修自检表',type:'error'},{bound:true});t.after(v.stop);await nextTick()
 v.find(n=>n.type==='toast').props['onUpdate:show'](false);await nextTick();assert.equal(v.props.message,'')
 v.props.message='请签署装修自检表';await nextTick();assert.equal(v.find(n=>n.type==='toast').props.show,true)
})
test('持续业务提示保留内嵌核对入口，不自动弹出',async t=>{
 const v=mount({message:'办理结果待确认，请先核对结果',type:'warning'},{action:true});t.after(v.stop);await nextTick()
 assert.ok(v.find(n=>n.type==='notice'));assert.ok(v.find(n=>n.type==='button'));assert.equal(v.find(n=>n.type==='toast'),undefined)
})
test('加载失败保持失败状态与重试入口，浮层关闭不清空只读错误',async t=>{
 const v=mount({message:'房屋加载失败',type:'error',inline:true},{action:true});t.after(v.stop);await nextTick()
 assert.ok(v.find(n=>n.type==='notice'));assert.ok(v.find(n=>n.type==='button'))
 v.find(n=>n.type==='toast').props['onUpdate:show'](false);await nextTick();assert.equal(v.props.message,'房屋加载失败');assert.ok(v.find(n=>n.type==='notice'))
})
