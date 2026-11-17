import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {parse,compileScript} from 'vue/compiler-sfc'
import {createRenderer,nextTick} from 'vue'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const filename=fileURLToPath(new URL('../mobile/components/OwnerApplicationForm.vue',import.meta.url))
const {descriptor}=parse(readFileSync(filename,'utf8'),{filename})
const bundled=await build({stdin:{contents:compileScript(descriptor,{id:'owner-form',inlineTemplate:true}).content,loader:'ts',resolveDir:filename.slice(0,filename.lastIndexOf('/'))},bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],plugins:[{name:'owner-form-controls',setup(builder){
 builder.onResolve({filter:/^vant$/},()=>({path:'vant',namespace:'controls'}))
 builder.onLoad({filter:/.*/,namespace:'controls'},()=>({contents:`import {h} from 'vue';const control=tag=>({inheritAttrs:false,setup:(_,ctx)=>()=>h(tag,ctx.attrs,ctx.slots.default?.())});export const Button=control('button'),Field=control('field'),RadioGroup=control('radios'),Radio=control('radio'),Checkbox=control('checkbox'),Empty=control('empty');`}))
 builder.onResolve({filter:/\.vue$/},args=>({path:args.path,namespace:'child'}))
 builder.onLoad({filter:/.*/,namespace:'child'},args=>({contents:`import {h} from 'vue';export default {inheritAttrs:false,setup:(_,ctx)=>()=>h(${JSON.stringify(args.path.split('/').at(-1))},ctx.attrs,ctx.slots.default?.())}`}))
 builder.onResolve({filter:/^\.\.\/i18n$/},()=>({path:'locale',namespace:'locale'}))
 builder.onLoad({filter:/.*/,namespace:'locale'},()=>({contents:'export const useI18n=()=>({t:key=>key})'}))
 builder.onResolve({filter:/\/ui\/icons$/},()=>({path:'icons',namespace:'icons'}))
 builder.onLoad({filter:/.*/,namespace:'icons'},()=>({contents:'export const HomeOutlined={render:()=>null},CheckOutlined=HomeOutlined'}))
 builder.onResolve({filter:/useUploadScope$/},()=>({path:'upload',namespace:'upload'}))
 builder.onLoad({filter:/.*/,namespace:'upload'},()=>({contents:'import {ref} from "vue";export const provideUploadScope=()=>({uploading:ref(false)})'}))
}}]})
const loaded={exports:{}}
new Function('require','module','exports',bundled.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports)
const renderer=createRenderer({
 createElement:type=>({type,children:[],props:{}}),createText:text=>({text}),createComment:()=>({}),setText(n,t){n.text=t},setElementText(n,t){n.text=t;n.children=[]},patchProp(n,k,_,v){n.props[k]=v},parentNode:n=>n.parent,nextSibling:n=>n.parent?.children[n.parent.children.indexOf(n)+1]??null,
 insert(n,p,a){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);const i=a?p.children.indexOf(a):-1;p.children.splice(i<0?p.children.length:i,0,n);n.parent=p},remove(n){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);n.parent=undefined}
})
const flush=async()=>{await nextTick();await new Promise(resolve=>setImmediate(resolve));await nextTick()}
const text=n=>(n.text||'')+(n.children||[]).map(text).join('')

test('二次装修缺配置仍能编辑申请并切回首次，保留草稿；日期和负责人证件有输入提示',async t=>{
 const home={relationshipId:'house',spaceId:'space',projectId:'project',customerId:'owner',houseType:'residential',telephone:'13800000000'}
 const calls=[],api={mine:true,households:async()=>[home],houseTypes:async()=>[],form:async(...args)=>{calls.push(args[3]);if(args[3]==='second')throw new Error('未找到二次装修资料配置');return {household:home,agreement:{content:'装修协议',deposit:1000},materials:[],selfInspections:[]}}}
 const root={children:[]},app=renderer.createApp(loaded.exports.default,{api,household:home})
 app.mount(root);t.after(()=>app.unmount());await flush()
 const find=(p,n=root)=>p(n)?n:(n.children||[]).map(c=>find(p,c)).find(Boolean)
 const form=()=>find(n=>n.type==='BusinessForm.vue').props.model
 const next=()=>find(n=>n.type==='button'&&text(n)==='下一步')
 assert.equal(next().props.disabled,false)
 for(const placeholder of ['请选择开工日期','请选择计划竣工日期','请输入负责人身份证号码'])assert.ok(find(n=>n.props?.placeholder===placeholder))
 Object.assign(form(),{contactPhone:'13900000000',ownerCertificate:'11010519491231002X',constructionUnit:'已填写公司',noticesAccepted:true})
 find(n=>n.type==='radios'&&n.props.modelValue==='first').props['onUpdate:modelValue']('second');await flush()
 assert.match(find(n=>n.type==='MobileNotice.vue').props.message,/二次装修/)
 assert.ok(find(n=>n.type==='radios'&&n.props.modelValue==='second'))
 assert.equal(next().props.disabled,true)
 next().props.onClick();await flush();assert.match(text(root),/装修申请信息/)
 assert.equal(form().contactPhone,'13900000000');assert.equal(form().constructionUnit,'已填写公司')
 find(n=>n.type==='radios'&&n.props.modelValue==='second').props['onUpdate:modelValue']('first');await flush()
 assert.equal(next().props.disabled,false);assert.equal(form().ownerCertificate,'11010519491231002X')
 assert.equal(find(n=>n.type==='MobileNotice.vue'),undefined)
 assert.deepEqual(calls,['first','second','first'])
})
