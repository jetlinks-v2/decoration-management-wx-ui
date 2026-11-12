<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Field as VanField } from 'vant'
import { RadioGroup as VanRadioGroup } from 'vant'
import { Radio as VanRadio } from 'vant'
import MobileNotice from './ui/MobileNotice.vue'
import BusinessField from './ui/BusinessField.vue'
import BusinessForm from './ui/BusinessForm.vue'

import {computed,reactive,ref,watch} from 'vue'
import dayjs from 'dayjs'
import type {Application,Task,Action,CheckResult,Violation} from '../../types/decoration'
import type {DecorationApi} from '../../services/decorationApi'
import CheckForm from '../../components/decoration/CheckForm.vue'
import TaskResults from '../../components/decoration/TaskResults.vue'
import FilePicker from '../../components/decoration/FilePicker.vue'
import TaskHandlingRecords from '../../components/decoration/TaskHandlingRecords.vue'
import {taskNames,taskStates,dateText} from '../model'
const props=defineProps<{task:Task;row:Application;api:DecorationApi;busy:boolean;canHandle?:boolean;canReview?:boolean;owner?:boolean}>()
const emit=defineEmits<{action:[string,Partial<Action>,boolean]}>()
const results=ref<CheckResult[]>([]),error=ref(''),form=reactive({passed:true,remark:'',fileIds:[] as string[],deadline:'',violations:[] as Violation[]})
const mode=computed(()=>props.row.actualEndTime?'':props.owner&&['owner_rectification','rectification_rejected'].includes(props.task.status)?'rectification':!props.owner&&props.task.status==='pending'&&props.canHandle&&props.task.feedbackAllowed?'feedback':!props.owner&&props.task.status==='waiting_review'&&props.canReview&&props.task.reviewAllowed?'review':'')
const dirty=computed(()=>!form.passed||!!form.deadline||!!form.remark||form.fileIds.length>0||form.violations.length>0||results.value.some(r=>r.value||r.fileIds.length||!r.qualified))
watch(()=>[props.task.id,props.task.modifyTime],()=>{results.value=props.task.details.checks.filter(c=>c.enabled).map(c=>({itemId:c.id,fileIds:[],qualified:true}));Object.assign(form,{passed:true,remark:'',fileIds:[],deadline:'',violations:[]});error.value=''},{immediate:true})
watch(results,values=>{if(values.some(r=>!r.qualified))form.passed=false},{deep:true})
function submit(){
 if(props.busy||!mode.value)return
 error.value=''
 if(mode.value==='rectification'&&!form.remark.trim()&&!form.fileIds.length){error.value='请填写整改说明或上传整改照片';return}
 if(mode.value==='feedback'){
  // 与服务端冻结的检查配置一致，先指出具体缺项，保留当前填写内容。
  for(const item of props.task.details.checks.filter(item=>item.enabled)){
   const result=results.value.find(result=>result.itemId===item.id)
   const filled=item.inputType==='image'?!!result?.fileIds.length:!!result?.value?.trim()
   if(item.required&&!filled){error.value=`请填写检查项“${item.name}”的结果`;return}
   if(result?.qualified===false&&(!result.rectification?.trim()||!result.deadline)){error.value=`请填写检查项“${item.name}”的整改内容和截止日期`;return}
  }
  if(form.passed&&results.value.some(r=>!r.qualified)){error.value='存在不合格检查项，不能提交为通过';return}
  if(props.task.kind==='daily'&&!form.passed&&(!form.violations.length||form.violations.some(v=>!v.location.trim()||!v.rectification.trim()))){error.value='请填写违规位置和整改要求';return}
 }
 if(mode.value==='review'&&!form.passed&&!form.remark.trim()){error.value='请说明整改未通过的原因';return}
 const name=mode.value==='rectification'?'rectification':mode.value==='review'?'rectification/review':props.task.kind==='daily'?'inspection/feedback':'acceptance/feedback'
 emit('action',name,{taskId:props.task.id,passed:form.passed,remark:form.remark,fileIds:form.fileIds,results:results.value,violations:form.passed?[]:form.violations,deadline:form.deadline?dayjs(form.deadline).endOf('day').valueOf():undefined},mode.value!=='rectification')
}
defineExpose({dirty})
</script>
<template>
 <section class="mobile-surface task-record"><div class="staff-task-head"><h2>{{task.status==='waiting_review'?'整改复核':taskNames[task.kind]}}</h2><span class="status-pill">{{taskStates[task.status]||task.status}}</span></div>
  <p class="muted">{{dateText(task.modifyTime)}} · {{task.assigneeName||task.details.inspectionRoles?.map(r=>r.roleName).join('、')||'待办理'}}</p>
  <p v-if="task.kind==='daily'">巡检日期：{{task.details.scheduledDate||'—'}}<br>有效时段：{{dateText(task.details.startTime)}} — {{dateText(task.details.endTime)}}</p>
  <p v-if="task.kind.includes('Acceptance')">申请验收日期：{{dateText(task.acceptanceDate)}}</p>
  <template v-if="task.status!=='pending'">
   <p v-if="task.details.feedback" class="feedback-note">{{task.details.feedback}}</p><TaskResults :task="task" :row="row" :api="api" />
   <div v-for="(violation,index) in task.details.violations" :key="index" class="violation-item"><strong>{{index+1}}. {{violation.location}}</strong><p>{{violation.rectification}}</p><FilePicker :value="violation.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly /></div>
   <p v-if="task.details.deadline" class="warning-text">请于 {{dateText(task.details.deadline)}} 前完成整改</p>
   <FilePicker :value="task.details.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly />
   <div v-if="task.details.rectificationRemark||task.details.rectificationFiles.length" class="rectification-result"><h3>业主整改反馈</h3><p>{{task.details.rectificationRemark}}</p><FilePicker :value="task.details.rectificationFiles" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly /></div>
   <TaskHandlingRecords :records="task.details.handlingRecords||[]" :row="row" :api="api" />
  </template>
 </section>
 <BusinessForm :model="form" v-if="mode" layout="vertical" class="mobile-form" :disabled="busy" @submit="submit">
  <section class="mobile-surface">
   <h2>{{mode==='rectification'?'提交整改反馈':mode==='review'?'填写整改复核结果':'现场检查'}}</h2>
   <CheckForm v-if="mode==='feedback'" v-model:value="results" :items="task.details.checks" :api="api" :project-id="row.projectId" :decoration-id="row.id" :readonly="busy" />
   <BusinessField v-if="mode!=='rectification'" label="检查结果" required><van-radio-group v-model="form.passed"><van-radio :name="true">通过</van-radio><van-radio :name="false">不通过</van-radio></van-radio-group></BusinessField>
   <template v-if="mode==='feedback'&&task.kind==='daily'&&!form.passed">
    <p class="warning-text">提交后将直接下发业主整改，请准确填写整改要求。</p>
    <div v-for="(violation,index) in form.violations" :key="index" class="violation-editor"><BusinessField :label="`违规位置 ${index+1}`" required><van-field v-model="violation.location" placeholder="例如：阳台外立面" /></BusinessField><BusinessField label="整改要求" required><van-field v-model="violation.rectification" type="textarea" :rows="2" autosize /></BusinessField><FilePicker v-model:value="violation.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" :readonly="busy" /><van-button type="danger" plain :disabled="busy" @click="form.violations.splice(index,1)">移除此项</van-button></div>
    <van-button block :disabled="busy" @click="form.violations.push({location:'',rectification:'',fileIds:[]})">添加违规事项</van-button>
    <BusinessField label="整改截止日期"><van-field v-model="form.deadline" type="date" /></BusinessField>
   </template>
   <BusinessField :label="mode==='rectification'?'整改说明':'处理意见'" :required="mode==='review'&&!form.passed"><van-field v-model="form.remark" :maxlength="2000" type="textarea" :rows="3" autosize :placeholder="mode==='rectification'?'请描述已完成的整改内容':'请填写现场检查或复核意见'" /></BusinessField>
   <BusinessField v-if="mode!=='review'" :label="mode==='rectification'?'整改照片 / 附件':'现场照片 / 附件'"><FilePicker v-model:value="form.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" :readonly="busy" /></BusinessField>
   <MobileNotice v-if="error" type="error" :message="error" show-icon />
  </section>
  <div class="mobile-bottom-actions"><van-button block type="primary" size="large" native-type="submit" :loading="busy">{{mode==='rectification'?'提交整改，申请复核':mode==='feedback'&&task.kind==='daily'&&!form.passed?'提交并下发业主整改':'确认提交'}}</van-button></div>
 </BusinessForm>
 <p v-else-if="!row.actualEndTime&&task.status==='pending'" class="mobile-footnote">当前账号没有办理权限，或任务已不属于本人。</p>
</template>
