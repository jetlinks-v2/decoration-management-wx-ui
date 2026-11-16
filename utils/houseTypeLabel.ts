export interface HouseTypeOption { value: string; text?: string; label?: string }

/** 优先显示字典label/text；字典缺项时使用既有标准类型名称，不把档案编码显示为名称。 */
export function houseTypeLabel(value: string | undefined, options: HouseTypeOption[]): string {
 const option=options.find(item=>item.value===value)
 const name=[option?.label,option?.text].find(text=>text?.trim()&&text.trim()!==value)
 if(name)return name.trim()
 return ({commercial:'商业',residential:'住宅',office:'办公',industrial:'工业'} as Record<string,string>)[value||'']||''
}
