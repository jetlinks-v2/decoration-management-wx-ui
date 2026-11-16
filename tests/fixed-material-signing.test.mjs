import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const compiled=await build({stdin:{contents:'export * from "./utils/fixedMaterialDocuments";export * from "./services/materialDocument";export * from "./utils/materialDocumentImage"',resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,format:'cjs',platform:'node',external:['pdfjs-dist','pdfjs-dist/build/pdf.worker.min.mjs?url']})
const module={exports:{}}
new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const {fixedMaterialDocument,loadMaterialPages,materialDocumentImage}=module.exports

test('固定签署资料兼容旧名称和ID，自定义资料和图纸不匹配',()=>{
 for(const [name,id,title] of [['消防责任书','old-fire','消防安全承诺书'],['装修须知','old-notice','装修告知书'],['新名称','fixed-fire-safety','消防安全承诺书']]){
  assert.equal(fixedMaterialDocument({id,name,kind:'material'}).title,title)
 }
 assert.equal(fixedMaterialDocument({id:'custom',name:'自定义文件',kind:'material'}),undefined)
 assert.equal(fixedMaterialDocument({id:'fixed-fire-safety',name:'消防安全承诺书',kind:'drawing'}),undefined)
})

test('固定资料用完整代码正文生成页面，不请求PC附件；自定义资料仍认证下载',async()=>{
 const originalDocument=globalThis.document,originalFetch=globalThis.fetch,texts=[],downloaded=[]
 const ctx={font:'',measureText:text=>({width:text.length*28}),fillRect(){},fillText:text=>texts.push(text)}
 globalThis.document={createElement:()=>({getContext:()=>ctx,toBlob:done=>done(new Blob(['png'],{type:'image/png'}))})}
 globalThis.fetch=async()=>{throw new Error('固定资料不得请求PC文件')}
 const api={download:async id=>{downloaded.push(id);return new Blob(['image'],{type:'image/png'})}}
 try{
  for(const id of ['fixed-fire-safety','fixed-notice']){
   texts.length=0
   const item={id,name:'配置名称',kind:'material',templateFileId:'pc-word'},template=fixedMaterialDocument(item)
   const urls=await loadMaterialPages(api,item,{spaceName:'1栋101',startTime:Date.parse('2026-11-16T00:00:00+08:00'),completionTime:Date.parse('2026-12-16T00:00:00+08:00')})
   assert.ok(urls.length>0);assert.ok(urls.length<6)
   const rendered=texts.join('')
   for(const section of template.sections){assert.ok(rendered.includes(section.title));for(const paragraph of section.paragraphs)assert.ok(rendered.includes(paragraph.text),paragraph.text)}
   if(template.intro){assert.ok(rendered.includes(template.intro));assert.match(rendered,/装修地点：1栋101/);assert.match(rendered,/2026-11-16 至 2026-12-16/)}
   assert.equal(template.sections.length,id==='fixed-fire-safety'?7:2)
   urls.forEach(URL.revokeObjectURL)
  }
  assert.deepEqual(downloaded,[])
  const urls=await loadMaterialPages(api,{id:'custom',name:'自定义',kind:'material',templateFileId:'private-image'})
  assert.deepEqual(downloaded,['private-image']);urls.forEach(URL.revokeObjectURL)
  await assert.rejects(loadMaterialPages(api,{id:'custom',name:'未配置',kind:'material'}),/尚未配置模板/)
 }finally{globalThis.document=originalDocument;globalThis.fetch=originalFetch}
})

test('签字图片保留全部正文页面，消防签章与告知书双签章区域分别生成',async()=>{
 const originalDocument=globalThis.document,originalImage=globalThis.Image,texts=[],images=[]
 const ctx={measureText:text=>({width:text.length*22}),fillRect(){},fillText:text=>texts.push(text),drawImage:(...args)=>images.push(args)}
 globalThis.document={createElement:()=>({getContext:()=>ctx,toBlob:done=>done(new Blob(['png'],{type:'image/png'}))})}
 globalThis.Image=class{naturalWidth=1000;naturalHeight=2000;async decode(){}}
 const signature={naturalWidth:600,naturalHeight:200}
 try{
  for(const footer of ['fireSafety','notice']){
   texts.length=0;images.length=0
   const blob=await materialDocumentImage('房屋：101',['page-1','page-2'],signature,footer)
   assert.equal(blob.type,'image/png');assert.equal(images.length,3);assert.equal(images.at(-1)[0],signature)
   assert.ok(texts.includes(footer==='fireSafety'?'承诺单位或个人（签章）：':'客户签章：'))
   assert.equal(texts.includes('装修公司签章：'),footer==='notice')
  }
 }finally{globalThis.document=originalDocument;globalThis.Image=originalImage}
})
