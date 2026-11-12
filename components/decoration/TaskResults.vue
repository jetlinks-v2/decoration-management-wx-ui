<script setup lang="ts">
import { CollapseItem as VanCollapseItem } from 'vant'
import BusinessCollapse from '../../mobile/components/ui/BusinessCollapse.vue'
import DetailFields from '../../mobile/components/ui/DetailFields.vue'
import DetailField from '../../mobile/components/ui/DetailField.vue'

import {computed} from 'vue'
import {useI18n} from '../../mobile/i18n'
import type {Application,Task} from '../../types/decoration'
import type {DecorationApi} from '../../services/decorationApi'
import FilePicker from './FilePicker.vue'
const {t}=useI18n()
const label=(key:string)=>t(`Decoration.detailFields.${key}`)
const props=defineProps<{task:Task;row:Application;api:DecorationApi}>()
const entries=computed(()=>props.task.details.checks.filter(item=>item.enabled).map(item=>({item,result:props.task.details.results.find(result=>result.itemId===item.id)})))
const date=(time?:number)=>time?new Date(time).toLocaleString():'—'
</script>
<template>
 <BusinessCollapse v-if="entries.length" ghost>
  <van-collapse-item name="results" title="检查内容与结果">
   <div v-for="{item,result} in entries" :key="item.id" class="decoration-card">
    <DetailFields class="detail-fields" :column="{xs:1,lg:2}" size="small">
      <DetailField :label="label('category')">{{item.category||'—'}}</DetailField><DetailField :label="label('checkName')">{{item.name}}</DetailField>
      <DetailField v-if="item.standard" :label="label('standard')" :span="2">{{item.standard}}</DetailField><DetailField v-if="item.example" :label="label('instructions')" :span="2">{{item.example}}</DetailField>
      <template v-if="item.min!=null||item.max!=null"><DetailField :label="label('minimum')">{{item.min??'—'}}</DetailField><DetailField :label="label('maximum')">{{item.max??'—'}}</DetailField></template>
      <DetailField v-if="item.exampleFileId" :label="label('referenceFiles')" :span="2"><FilePicker :value="[item.exampleFileId]" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly /></DetailField>
      <DetailField :label="label('value')">{{result?.value??'—'}}</DetailField><DetailField :label="label('result')">{{label(result?result.qualified?'qualified':'unqualified':'unfilled')}}</DetailField>
      <template v-if="result">
        <DetailField :label="label('attachments')" :span="2"><FilePicker :value="result.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly /></DetailField>
        <DetailField v-if="result.rectification" :label="label('rectification')" :span="2">{{result.rectification}}</DetailField><DetailField v-if="result.deadline" :label="label('deadline')">{{date(result.deadline)}}</DetailField>
      </template>
    </DetailFields>
   </div>
  </van-collapse-item>
 </BusinessCollapse>
</template>
