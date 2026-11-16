import type {MaterialDefinition} from '../types/decoration'
import type {DecorationApi} from './decorationApi'
import {fixedMaterialDocument} from '../utils/fixedMaterialDocuments'
import {fixedMaterialPages} from '../utils/fixedMaterialPages'

/** 两份固定资料使用小程序代码模板；自定义资料仍认证读取配置的PDF或图片。 */
export async function loadMaterialPages(api:DecorationApi,item:MaterialDefinition,location:{spaceName:string;startTime?:number;completionTime?:number}={spaceName:''}):Promise<string[]>{
 const builtin=fixedMaterialDocument(item)
 if(builtin)return fixedMaterialPages(builtin,location)
 if(!item.templateFileId)throw new Error('该资料尚未配置模板，请联系物业完善资料模板')
 const blob=await api.download(item.templateFileId)
 if(blob.type.startsWith('image/'))return [URL.createObjectURL(blob)]
 const bytes=new Uint8Array(await blob.arrayBuffer())
 if(!(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46)){
  throw new Error('在线签署模板请使用PDF或图片格式')
 }
 const pdfjs=await import('pdfjs-dist')
 const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
 pdfjs.GlobalWorkerOptions.workerSrc=worker.default
 const pdf=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),useSystemFonts:true,isEvalSupported:false}).promise
 const urls:string[]=[]
 try{
  if(pdf.numPages>20)throw new Error('资料模板超过20页，请拆分后配置')
  for(let index=1;index<=pdf.numPages;index++){
   const page=await pdf.getPage(index),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:1000/base.width})
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height)
   const context=canvas.getContext('2d');if(!context)throw new Error('浏览器不支持资料预览')
   await page.render({canvasContext:context,viewport}).promise
   const image=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('资料预览生成失败')),'image/png'))
   urls.push(URL.createObjectURL(image));canvas.width=0;canvas.height=0;page.cleanup()
  }
  return urls
 }catch(error){urls.forEach(URL.revokeObjectURL);throw error}finally{await pdf.destroy()}
}
