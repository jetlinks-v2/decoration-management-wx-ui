<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Field as VanField } from 'vant'
import { RadioGroup as VanRadioGroup } from 'vant'
import { Radio as VanRadio } from 'vant'
import {DatePicker as VanDatePicker} from 'vant'
import MobileNotice from './ui/MobileNotice.vue'
import MobilePopup from './ui/MobilePopup.vue'
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
import {checkFeedback} from '../../utils/checkFeedback'
const props=defineProps<{task:Task;row:Application;api:DecorationApi;busy:boolean;canHandle?:boolean;canReview?:boolean;owner?:boolean}>()
const emit=defineEmits<{action:[string,Partial<Action>,boolean]}>()
const results=ref<CheckResult[]>([]),error=ref(''),form=reactive({passed:true,remark:'',fileIds:[] as string[],deadline:'',violations:[] as Violation[]})
const photoIds=ref<string[]>([]),deadlineOpen=ref(false),deadlineParts=ref<string[]>([])
const minDeadline=computed(()=>dayjs().startOf('day').toDate())
const hasFailedChecks=computed(()=>results.value.some(result=>!result.qualified))
const mode=computed(()=>props.row.actualEndTime?'':props.owner&&['owner_rectification','rectification_rejected'].includes(props.task.status)?'rectification':!props.owner&&props.task.status==='pending'&&props.canHandle&&props.task.feedbackAllowed?'feedback':!props.owner&&props.task.status==='waiting_review'&&props.canReview&&props.task.reviewAllowed?'review':'')
const dirty=computed(()=>!form.passed||!!form.deadline||!!form.remark||form.fileIds.length>0||photoIds.value.length>0||form.violations.length>0||results.value.some(r=>r.value||r.fileIds.length||!r.qualified))
watch(()=>[props.task.id,props.task.modifyTime],()=>{results.value=props.task.details.checks.filter(c=>c.enabled).map(c=>({itemId:c.id,fileIds:[],qualified:true}));Object.assign(form,{passed:true,remark:'',fileIds:[],deadline:'',violations:[]});photoIds.value=[];deadlineOpen.value=false;error.value=''},{immediate:true})
watch(hasFailedChecks,failed=>{if(mode.value==='feedback'){form.passed=!failed;if(!failed){form.deadline='';deadlineOpen.value=false}}})
function confirmDeadline(){
 const value=dayjs(deadlineParts.value.join('-'))
 if(!value.isValid()||value.endOf('day').valueOf()<Date.now()){error.value='请选择今天或之后的整改截止日期';return}
 form.deadline=value.format('YYYY-MM-DD');deadlineOpen.value=false;submit()
}
function submit(){
 if(props.busy||!mode.value)return
 error.value=''
 if(mode.value==='rectification'&&!form.remark.trim()&&!form.fileIds.length&&!photoIds.value.length){error.value='请填写整改说明或上传整改照片';return}
 if(mode.value==='feedback'){
  const feedback=checkFeedback(props.task.details.checks,results.value,form.deadline?dayjs(form.deadline).endOf('day').valueOf():undefined)
  if(feedback.error){error.value=feedback.error;return}
  form.passed=feedback.passed
  if(feedback.needsDeadline){deadlineParts.value=dayjs().format('YYYY-MM-DD').split('-');deadlineOpen.value=true;return}
  if(!feedback.passed&&dayjs(form.deadline).endOf('day').valueOf()<Date.now()){form.deadline='';deadlineParts.value=dayjs().format('YYYY-MM-DD').split('-');deadlineOpen.value=true;return}
  results.value=feedback.results
  form.violations=props.task.kind==='daily'?feedback.violations:[]
 }
 if(mode.value==='review'&&!form.passed&&!form.remark.trim()){error.value='请说明整改未通过的原因';return}
 const name=mode.value==='rectification'?'rectification':mode.value==='review'?'rectification/review':props.task.kind==='daily'?'inspection/feedback':'acceptance/feedback'
 emit('action',name,{taskId:props.task.id,passed:form.passed,remark:form.remark,fileIds:[...photoIds.value,...form.fileIds],results:results.value,violations:form.passed?[]:form.violations,deadline:mode.value==='feedback'&&form.passed?undefined:form.deadline?dayjs(form.deadline).endOf('day').valueOf():undefined},mode.value!=='rectification')
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
   <h2>{{mode==='rectification'?'提交整改反馈':mode==='review'?'填写整改复核结果':'检查项'}}</h2>
   <CheckForm v-if="mode==='feedback'" v-model:value="results" :items="task.details.checks" :api="api" :project-id="row.projectId" :decoration-id="row.id" :readonly="busy" />
   <BusinessField v-if="mode==='review'" label="检查结果" required><van-radio-group v-model="form.passed"><van-radio :name="true">通过</van-radio><van-radio :name="false">不通过</van-radio></van-radio-group></BusinessField>
   <BusinessField :label="mode==='rectification'?'整改说明':'处理意见'" :required="mode==='review'&&!form.passed"><van-field v-model="form.remark" :maxlength="2000" type="textarea" :rows="3" autosize :placeholder="mode==='rectification'?'请描述已完成的整改内容':'请填写现场检查或复核意见'" /></BusinessField>
   <BusinessField v-if="mode!=='review'" :label="mode==='rectification'?'整改照片':'现场照片'"><FilePicker v-model:value="photoIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" accept=".jpg,.jpeg,.png,.webp,.heic,.gif,.bmp" :readonly="busy" /></BusinessField>
   <BusinessField v-if="mode!=='review'" label="附件"><FilePicker v-model:value="form.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" :readonly="busy" /></BusinessField>
   <BusinessField v-if="mode==='feedback'" label="检查结果"><span :class="hasFailedChecks?'warning-text':''">{{hasFailedChecks?'不通过':'通过'}}</span></BusinessField>
   <MobileNotice v-if="error" type="error" v-model:message="error" show-icon />
  </section>
  <div class="mobile-bottom-actions"><van-button block type="primary" size="large" native-type="submit" :loading="busy">{{mode==='rectification'?'提交整改，申请复核':mode==='feedback'&&task.kind==='daily'&&!form.passed?'提交并下发业主整改':'确认提交'}}</van-button></div>
 </BusinessForm>
 <MobilePopup v-model:show="deadlineOpen" title="选择整改截止日期" :close-on-click-overlay="false">
  <p>存在不合格检查项，检查结果为不通过。请选择统一的整改截止日期后提交。</p>
  <van-date-picker v-model="deadlineParts" :min-date="minDeadline" :max-date="new Date(2100,11,31)" :show-toolbar="false" />
  <div class="popup-actions"><van-button block :disabled="busy" @click="deadlineOpen=false">返回修改</van-button><van-button block type="primary" :loading="busy" @click="confirmDeadline">确认日期并提交</van-button></div>
 </MobilePopup>
 <p v-if="!mode&&!row.actualEndTime&&task.status==='pending'" class="mobile-footnote">当前账号没有办理权限，或任务已不属于本人。</p>
</template>
