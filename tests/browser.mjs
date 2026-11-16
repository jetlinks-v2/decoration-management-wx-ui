import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const standalone=process.env.H5_STANDALONE_URL||'http://127.0.0.1:9413/decoration-h5/'
const official=process.env.H5_OFFICIAL_URL||'http://127.0.0.1:9414/'
const house={relationshipId:'house',spaceId:'room',customerId:'owner',projectId:'project',spaceName:'1栋101',customerName:'测试业主',telephone:'13800000000'}
const permissions=[{id:'decoration-owner',actions:['query']},{id:'decoration-task',actions:['query']}]
function respond(path){
 if(path==='/authorize/login/configs')return {encrypt:{enabled:false}}
 if(path==='/authorize/captcha/config')return {enabled:false,type:'image'}
 if(path==='/authorize/login')return {token:'fixture-standalone'}
 if(path==='/authorize/me')return {user:{id:'person',name:'测试用户'},permissions}
 if(path==='/user/detail')return {id:'person',name:'测试用户'}
 if(path==='/menu/user-own/tree')return [{code:'decoration/Inspection',buttons:[{id:'handle'},{id:'taskReview'}]}]
 if(path.endsWith('/_houses'))return [{household:house,projectName:'测试项目',applicationCount:0,processing:false}]
 if(path.includes('/households/'))return [house]
 if(path.includes('/directory/form/'))return {household:house,materials:[],agreement:{title:'装修协议',content:'请遵守规定',supplements:[],deposit:1000}}
 if(path==='/decoration/directory/projects')return [{id:'project',name:'测试项目',organizationType:'project'}]
 if(path.endsWith('/_query')||path.endsWith('/_summaries'))return {data:[],total:0}
 return []
}
const artifacts='.agent-runtime/browser';await mkdir(artifacts,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
async function setup(width,embedded,application='real-app'){
 const page=await browser.newPage({viewport:{width,height:844}}),calls=[],errors=[]
 page.setDefaultTimeout(8000)
 page.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())})
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});page.on('console',m=>{if(/Failed to resolve component|Unhandled error/.test(m.text()))errors.push(m.text())})
 await page.route(url=>url.pathname.startsWith('/api/'),async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/^.*?\/api/,'').split('?')[0],headers=request.headers();calls.push({path,method:request.method()})
  if(path.startsWith('/decoration/')){
   assert.equal(headers['x-asset-scope'],`business_application:${embedded?'real-app':'app-a'}`)
   assert.equal(headers['x-access-token'],embedded?'fixture-project':'fixture-standalone')
   assert.equal(headers['x-tenant-domain'],embedded?'tenant-fixture':undefined)
  }
  await route.fulfill({json:{status:200,result:respond(path)}})
 })
 if(embedded)await page.addInitScript(({application,official})=>{
  window.__MICRO_APP_ENVIRONMENT__=true;window.__bridgeListeners=[];window.__bridgeEvents=[]
  const data={channel:'jetlinks.mobile.application',version:1,moduleId:'decoration-app',launchId:'browser-fixture',project:{code:'tenant-fixture',name:'测试租户'},access:{token:'fixture-project',apiUrl:new URL('/api',official).href},application:application?{id:'real-app',name:'装修管理',templateId:'template',templateCode:application==='wrong'?'Wrong':'DecorationManagement'}:null}
  window.microApp={getData:()=>data,addDataListener:fn=>window.__bridgeListeners.push(fn),removeDataListener:fn=>window.__bridgeListeners=window.__bridgeListeners.filter(v=>v!==fn),dispatch:event=>window.__bridgeEvents.push(event)}
 },{application,official})
 return {page,calls,errors}
}
async function layout(page,label,width){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');await page.screenshot({path:`${artifacts}/${label}-${width}.png`,fullPage:true})}
async function ownerFlow(page,width,embedded){
 await page.locator('input[placeholder="选择装修房屋"]').click()
 await page.locator('.selection-options').getByText('测试项目 / 1栋101',{exact:true}).click()
 await page.locator('.mobile-popup:visible').getByRole('button',{name:'确定',exact:true}).click()
 await page.getByRole('button',{name:/开始申请|申请装修|发起装修/}).click()
 await page.getByRole('heading',{name:'装修申请信息',exact:true}).waitFor()
 await layout(page,(embedded?'official':'standalone')+'-form',width)
 await page.getByRole('button',{name:'下一步',exact:true}).click()
 await page.getByText('请填写申请信息并确认装修须知与协议',{exact:true}).waitFor()
 await page.getByText('二次装修',{exact:true}).click();assert.equal(await page.getByRole('radio',{name:'二次装修'}).getAttribute('aria-checked'),'true')
 const previous=await page.evaluate(()=>history.length)
 if(embedded){await page.evaluate(()=>window.__bridgeListeners.forEach(fn=>fn({channel:'jetlinks.mobile.application',version:1,moduleId:'decoration-app',launchId:'browser-fixture',type:'navigation.back',requestId:'form-back'})))}
 else await page.getByRole('button',{name:'返回',exact:true}).click()
 await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'继续填写',exact:true}).click()
 await page.getByRole('heading',{name:'装修申请信息',exact:true}).waitFor()
 if(embedded){assert.equal(await page.evaluate(()=>history.length),previous);assert.equal(await page.evaluate(()=>window.__bridgeEvents.find(e=>e.requestId==='form-back')?.handled),true)}
 // A cancelled native Back keeps the form; page Back must confirm independently.
 await page.getByRole('button',{name:'返回',exact:true}).click()
 await page.getByRole('dialog').waitFor()
 await page.getByRole('button',{name:'放弃修改',exact:true}).click()
 await page.getByRole('heading',{name:'装修申请信息',exact:true}).waitFor({state:'detached'})
 if(embedded){
  await page.evaluate(()=>window.__bridgeListeners.forEach(fn=>fn({channel:'jetlinks.mobile.application',version:1,moduleId:'decoration-app',launchId:'browser-fixture',type:'navigation.back',requestId:'root-back'})))
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(()=>window.__bridgeEvents.find(e=>e.requestId==='root-back')?.handled),false)
  assert.equal(await page.evaluate(()=>history.length),previous)
 }

}
try{
 for(const width of [320,390]){
  for(const side of (process.env.H5_BROWSER_OFFICIAL_ONLY?[]:['owner','staff'])){
   const {page,calls,errors}=await setup(width,false)
   await page.goto(standalone+'?applicationScope=app-a&side='+side)
   await page.locator('input[autocomplete=username]').waitFor();await layout(page,'login-'+side,width)
   await page.getByRole('button',{name:'登录',exact:true}).click();assert.equal(calls.some(c=>c.path==='/authorize/login'),false)
   await page.locator('input[autocomplete=username]').fill('fixture');await page.locator('input[autocomplete=current-password]').fill('fixture-password');await page.getByRole('button',{name:'登录',exact:true}).click()
   await page.locator('input[autocomplete=username]').waitFor({state:'detached'});await page.waitForTimeout(150)
   await layout(page,'standalone-'+side,width)
   if(side==='owner')await ownerFlow(page,width,false)
   else {await page.getByRole('tab',{name:'验收任务',exact:true}).click();await page.getByRole('navigation',{name:'装修员工导航'}).getByRole('button',{name:'历史记录',exact:true}).click()}
   assert.deepEqual(errors,[]);await page.close()
  }
  const {page,errors}=await setup(width,true)
  await page.goto(official);await page.locator('.decoration-mobile').waitFor();await layout(page,'official-owner',width)
  assert.equal(await page.locator('input[autocomplete=username]').count(),0)
  await ownerFlow(page,width,true);assert.deepEqual(errors,[]);await page.close()
 }
 const staff=await setup(390,true)
 await staff.page.goto(official);await staff.page.locator('.decoration-mobile').waitFor()
 await staff.page.evaluate(()=>document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/applications/decoration-app/staff'))
 await staff.page.getByRole('tab',{name:'巡检任务',exact:true}).waitFor()
 await staff.page.getByRole('tab',{name:'验收任务',exact:true}).click()
 await layout(staff.page,'official-staff',390);assert.deepEqual(staff.errors,[]);await staff.page.close()
 for(const application of [null,'wrong']){
  const {page,calls}=await setup(390,true,application);await page.goto(official);await page.getByText(application?'应用模板与当前子模块不匹配，请检查部署入口':'请从应用列表打开已授权的真实应用',{exact:false}).first().waitFor();assert.equal(calls.some(c=>c.path.startsWith('/decoration/')),false);await page.close()
 }
 console.log('Decoration Vant 4: owner/staff standalone, official module, form validation, radios, discard dialog, Back, headers, preview and template rejection, 320/390 layout passed')
}catch(error){for(const context of browser.contexts())for(const page of context.pages()){console.log(await page.locator('body').innerHTML());await page.screenshot({path:artifacts+'/failure.png',fullPage:true})}throw error}finally{await browser.close()}
