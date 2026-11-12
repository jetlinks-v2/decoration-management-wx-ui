<script setup lang="ts">
import { Field as VanField } from 'vant'
import { Stepper as VanStepper } from 'vant'
import { RadioGroup as VanRadioGroup } from 'vant'
import { Radio as VanRadio } from 'vant'
import SelectField from '../../mobile/components/ui/SelectField.vue'
import DateField from '../../mobile/components/ui/DateField.vue'

import type { CheckItem, CheckResult } from '../../types/decoration'
import type { DecorationApi } from '../../services/decorationApi'
import FilePicker from './FilePicker.vue'
import dayjs from 'dayjs'
const props=defineProps<{items:CheckItem[];value:CheckResult[];api:DecorationApi;projectId:string;decorationId:string;readonly?:boolean}>()
const emit=defineEmits<{'update:value':[CheckResult[]]}>()
function update(id:string, patch:Partial<CheckResult>){const old=props.value.find(v=>v.itemId===id)||{itemId:id,fileIds:[],qualified:true};emit('update:value',[...props.value.filter(v=>v.itemId!==id),{...old,...patch}])}
</script>
<template>
  <div v-for="item in items.filter(i=>i.enabled)" :key="item.id" class="decoration-card">
    <h4>{{item.category}} · {{item.name}} <span v-if="item.required">*</span></h4>
    <p class="decoration-meta">{{item.example}} {{item.standard?`标准：${item.standard}`:''}} {{item.min!=null?`下限：${item.min}`:''}} {{item.max!=null?`上限：${item.max}`:''}}</p>
    <FilePicker v-if="item.exampleFileId" :value="[item.exampleFileId]" :api="api" :project-id="projectId" readonly />
    <FilePicker v-if="item.inputType==='image'" :value="value.find(v=>v.itemId===item.id)?.fileIds||[]" :api="api" :project-id="projectId" :decoration-id="decorationId" :readonly="readonly" @update:value="ids=>update(item.id,{fileIds:ids})" />
    <SelectField :disabled="readonly" v-else-if="item.inputType==='option'" :model-value="value.find(v=>v.itemId===item.id)?.value" :options="item.options.map(v=>({value:v,label:v}))" style="width:100%" @update:model-value="v=>update(item.id,{value:String(v)})" />
    <van-stepper :disabled="readonly" v-else-if="item.inputType==='number'" :min="-Number.MAX_SAFE_INTEGER" allow-empty :model-value="value.find(v=>v.itemId===item.id)?.value??''" @update:model-value="v=>update(item.id,{value:String(v??'')})" />
    <van-field :disabled="readonly" v-else :model-value="value.find(v=>v.itemId===item.id)?.value" @update:model-value="v=>update(item.id,{value:v})" />
    <van-radio-group :disabled="readonly" :model-value="value.find(v=>v.itemId===item.id)?.qualified??true" @update:model-value="v=>update(item.id,{qualified:v})"><van-radio :name="true">合格</van-radio><van-radio :name="false">不合格</van-radio></van-radio-group>
    <template v-if="value.find(v=>v.itemId===item.id)?.qualified===false">
      <van-field :disabled="readonly" placeholder="整改内容" :model-value="value.find(v=>v.itemId===item.id)?.rectification" @update:model-value="v=>update(item.id,{rectification:v})" />
      <DateField :disabled="readonly" placeholder="整改截止日期" :model-value="value.find(v=>v.itemId===item.id)?.deadline?dayjs(value.find(v=>v.itemId===item.id)?.deadline):undefined" @update:model-value="v=>update(item.id,{deadline:v?Number(v.valueOf()):undefined})" />
    </template>
  </div>
</template>
