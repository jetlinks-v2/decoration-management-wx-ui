import {readFileSync} from 'node:fs'
import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {parse,compileScript} from 'vue/compiler-sfc'
import {effectScope,reactive,nextTick} from 'vue'
import {test} from 'node:test'
import assert from 'node:assert/strict'
const filename=fileURLToPath(new URL('../mobile/components/MobileTaskRecord.vue',import.meta.url))
const built=await build({entryPoints:[filename],bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],plugins:[{name:'task-feedback',setup(builder){
 builder.onResolve({filter:/\.vue$/},args=>args.path===filename?undefined:{path:'child',namespace:'stub'})
 builder.onResolve({filter:/^vant$/},()=>({path:'vant',namespace:'stub'}))
 builder.onResolve({filter:/^\.\.\/model$/},()=>({path:'model',namespace:'stub'}))
 builder.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:args.path==='vant'?'export const Button={},Field={},RadioGroup={},Radio={},DatePicker={}':args.path==='model'?'export const taskNames={},taskStates={},dateText=()=>""':'export default {}'}))
 builder.onLoad({filter:/MobileTaskRecord\.vue$/},args=>{const {descriptor}=parse(readFileSync(args.path,'utf8'),{filename:args.path});return {contents:compileScript(descriptor,{id:'mobile-check-feedback'}).content,loader:'ts'}})
}}]})
const loaded={exports:{}}
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports)
function mount(kind){
 const props=reactive({task:{id:'task',kind,status:'pending',feedbackAllowed:true,modifyTime:1,details:{checks:[{id:'wall',category:'现场',name:'墙面',enabled:true,required:true,inputType:'text'}]}},row:{id:'decoration',projectId:'project'},api:{},busy:false,canHandle:true})
 const scope=effectScope(),events=[]
 const state=scope.run(()=>loaded.exports.default.setup(props,{emit:(...args)=>events.push(args),expose(){}}))
 return {props,state,events,stop:()=>scope.stop()}
}
for(const kind of ['daily','firstAcceptance','secondAcceptance'])test(`${kind} 不合格先补内容，再弹日期；确认后一次提交，不允许手动通过`,async()=>{
 const view=mount(kind),s=view.state
 try{
  s.results.value=[{itemId:'wall',value:'裂缝',qualified:false,fileIds:[]}]
  s.submit();assert.match(s.error.value,/整改内容/);assert.equal(s.deadlineOpen.value,false);assert.equal(view.events.length,0)
  s.results.value[0].rectification='修复墙面';await nextTick();s.submit()
  assert.equal(s.form.passed,false);assert.equal(s.deadlineOpen.value,true);assert.equal(view.events.length,0)
  s.deadlineParts.value=['2099','12','31'];s.photoIds.value=['photo'];s.form.fileIds=['file'];s.confirmDeadline()
  assert.equal(view.events.length,1)
  const [event,name,payload]=view.events[0]
  assert.equal(event,'action');assert.equal(name,kind==='daily'?'inspection/feedback':'acceptance/feedback')
  assert.equal(payload.passed,false);assert.ok(payload.deadline>0);assert.equal(payload.results[0].deadline,payload.deadline)
  assert.deepEqual(payload.fileIds,['photo','file']);assert.equal(payload.violations.length,kind==='daily'?1:0)
  s.results.value[0].qualified=true;await nextTick();s.submit()
  const passed=view.events.at(-1)[2]
  assert.equal(passed.passed,true);assert.equal(passed.deadline,undefined);assert.equal(passed.results[0].rectification,undefined);assert.deepEqual(passed.violations,[])
 }finally{view.stop()}
})
test('整改照片单独上传可以提交，整改复核仍由复核员选择结果',()=>{
 const view=mount('daily'),s=view.state
 try{
  view.props.owner=true;view.props.task.status='owner_rectification';s.photoIds.value=['rectified-photo'];s.submit()
  assert.equal(view.events[0][1],'rectification');assert.deepEqual(view.events[0][2].fileIds,['rectified-photo'])
  view.props.owner=false;view.props.task.status='waiting_review';view.props.canReview=true;view.props.task.reviewAllowed=true
  s.form.passed=false;s.form.remark='仍有问题';s.submit()
  assert.equal(view.events.at(-1)[1],'rectification/review');assert.equal(view.events.at(-1)[2].passed,false)
 }finally{view.stop()}
})
