import type {FixedMaterialDocument} from './fixedMaterialDocuments'

interface MaterialLocation {spaceName:string;startTime?:number;completionTime?:number}
interface TextLine {text:string;font:string;color:string;x:number;height:number}

/** 将代码内签署正文分页成图片，页面展示和最终签字图片复用同一份全文。 */
export async function fixedMaterialPages(template:FixedMaterialDocument,location:MaterialLocation):Promise<string[]> {
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')
 if(!ctx)throw new Error('浏览器不支持资料预览')
 canvas.width=1000
 const lines:TextLine[]=[]
 function paragraph(text:string,{bold=false,indent=0,color='#333',size=28,gap=16}={}){
  const font=`${bold?'600 ':''}${size}px sans-serif`,x=60+indent,width=880-indent
  ctx!.font=font
  let line=''
  for(const char of text){
   if(ctx!.measureText(line+char).width>width&&line){lines.push({text:line,font,color,x,height:46});line=''}
   line+=char
  }
  lines.push({text:line,font,color,x,height:46+gap})
 }
 paragraph(template.title,{bold:true,size:36,gap:30})
 if(template.footer==='fireSafety'){
  const date=(time?:number)=>time===undefined?'-':new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(time)
  paragraph(`装修地点：${location.spaceName||'-'}`)
  paragraph(`装修期限：${date(location.startTime)} 至 ${date(location.completionTime)}`,{gap:24})
 }
 if(template.intro)paragraph(template.intro)
 for(const section of template.sections){
  paragraph(section.title,{bold:true,gap:12})
  for(const row of section.paragraphs)paragraph(row.text,{indent:row.indentLevel===2?48:0,color:row.color==='blue'?'#1f7be3':'#333'})
 }
 const pages:TextLine[][]=[[]];let height=100
 for(const line of lines){
  if(height+line.height>2340){pages.push([]);height=100}
  pages[pages.length-1]!.push(line);height+=line.height
 }
 const urls:string[]=[]
 try{
  for(const page of pages){
   canvas.height=120+page.reduce((sum,line)=>sum+line.height,0)
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)
   let y=65
   for(const line of page){ctx.font=line.font;ctx.fillStyle=line.color;ctx.fillText(line.text,line.x,y);y+=line.height}
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('资料预览生成失败')),'image/png'))
   urls.push(URL.createObjectURL(blob))
  }
  return urls
 }catch(error){urls.forEach(URL.revokeObjectURL);throw error}finally{canvas.width=0;canvas.height=0}
}
