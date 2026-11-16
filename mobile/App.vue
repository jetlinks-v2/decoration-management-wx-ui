<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { ConfigProvider as VanConfigProvider } from 'vant'
import MobileNotice from './components/ui/MobileNotice.vue'
import MobileLoading from './components/ui/MobileLoading.vue'
import SelectField from './components/ui/SelectField.vue'

import {inShell} from './shell/runtime'
import {useShellNavigation} from './shell/navigation'
import {computed,inject,ref,watch} from 'vue'
import {useI18n} from './i18n'
import {LeftOutlined,ReloadOutlined,HomeOutlined,LogoutOutlined,FileAddOutlined,FileTextOutlined,BellOutlined} from './components/ui/icons'
import ProjectTreeSelect from '../components/decoration/ProjectTreeSelect.vue'
import OwnerHome from './components/OwnerHome.vue'
import OwnerRecords from './components/OwnerRecords.vue'
import OwnerNotifications from './components/OwnerNotifications.vue'
import OwnerWorkflow from './components/OwnerWorkflow.vue'
import StaffHome from './components/StaffHome.vue'
import OwnerApplicationForm from './components/OwnerApplicationForm.vue'
import OwnerApplicationDetail from './components/OwnerApplicationDetail.vue'
import StaffTaskDetail from './components/StaffTaskDetail.vue'
import {useMobileDecoration} from './useMobileDecoration'
import {useDiscardConfirm} from '../hooks/decoration/useDiscardConfirm'
import {mobileSide} from '../utils/mobileEntry'
import type {DecorationNotice} from '../types/decoration'
import {ownerSteps,type OwnerStep} from './model'
const props=defineProps<{standalone?:boolean;loggingOut?:boolean;side?:'owner'|'staff';entrySearch?:string}>()
const emit=defineEmits<{logout:[]}>()
const side=props.side||mobileSide(location.search)
const {t}=useI18n()
type Editor={dirty:boolean;saving:boolean;uncertain:boolean;reload?:()=>Promise<void>}
const form=ref<Editor>(),detail=ref<Editor>()
const confirmDiscard=useDiscardConfirm(()=> '当前有尚未提交的内容，确定离开吗？')
const blocked=()=>!!(form.value?.saving||form.value?.uncertain||detail.value?.saving||detail.value?.uncertain)
const dirty=()=>!!(form.value?.dirty||detail.value?.dirty)
async function canLeave(){if(blocked())return false;return !dirty()||await confirmDiscard()&&!blocked()}
const {api,permissions,projectId,projects,houses,householdId,household,current,rectificationCount,rows,notices,taskRows,staffTab,ownerTab,page,total,loading,error,invalid,view,detailId,taskId,detailStep,contextKey,load,start,navigate,back,changeProject,changeHouse,changeTab,created,applicationChanged,changePage}=useMobileDecoration(canLeave,side,()=>blocked()||dirty(),props.entrySearch)
const scrollTop=inject('business-scroll-top',()=>{})
watch([view,detailId,taskId,detailStep],scrollTop,{flush:'post'})
if(inShell())useShellNavigation('/applications/decoration-app',()=>!['list','history','notifications'].includes(view.value),()=>back(false),canLeave)
const title=computed(()=>view.value==='create'?'装修申请':view.value==='notifications'?t('Mobile.decorationNotifications'):view.value==='history'?t('Mobile.decorationRecords'):view.value==='workflow'?t('Mobile.workflowTitle'):view.value==='detail'?side==='staff'?'任务办理':detailStep.value==='rectification'?'巡检整改':ownerSteps().find(s=>s.key===detailStep.value)?.title||'装修详情':side==='owner'?t('Mobile.myDecoration'):'装修工作台')
const ownerRoot=computed(()=>side==='owner'&&['list','history','notifications'].includes(view.value))
const houseOptions=computed(()=>houses.value.map(home=>({value:home.household.relationshipId,label:`${home.projectName} / ${home.household.spaceName}`})))
function openStep(step:OwnerStep){const id=current.value?.id||detailId.value;if(id)navigate('detail',id,step);else if(step==='apply')navigate('create')}
function openNotice(notice:DecorationNotice){if(side==='staff'&&notice.taskId)void navigate('detail',notice.decorationId,'overview',notice.taskId);else if(notice.step!=='task')void navigate('detail',notice.decorationId,notice.step)}
async function signOut(){if(!props.loggingOut&&await canLeave())emit('logout')}
async function refresh(){if(await canLeave()){if(view.value==='detail')void detail.value?.reload?.();else void load()}}
defineExpose({canLeave})
</script>
<template>
 <van-config-provider><main class="decoration-mobile" :class="[`mobile-${side}`,{'has-owner-tabs':ownerRoot}]">
  <header class="mobile-header" :class="{'owner-home-header':side==='owner'&&view==='list'}">
   <template v-if="side==='owner'&&view==='list'"><HomeOutlined class="owner-header-home" /><SelectField class="owner-header-select" :model-value="householdId||undefined" :options="houseOptions" show-search option-filter-prop="label" clearable :loading="loading" :disabled="invalid||loading||!houses.length" :aria-label="t('Mobile.selectHouse')" :placeholder="t('Mobile.selectHouse')" @update:model-value="value=>changeHouse(typeof value==='string'?value:undefined)" /><van-button v-if="standalone" class="header-action" plain :aria-label="t('Mobile.logout')" :title="t('Mobile.logout')" :loading="loggingOut" @click="signOut"><LogoutOutlined /></van-button><van-button v-else class="header-action" plain :aria-label="t('Mobile.refresh')" @click="refresh"><ReloadOutlined /></van-button></template>
   <template v-else><van-button class="header-action" plain aria-label="返回" @click="back()"><LeftOutlined /></van-button><h1>{{title}}</h1><van-button v-if="!invalid&&view!=='create'" class="header-action" plain aria-label="刷新" @click="refresh"><ReloadOutlined /></van-button><span v-else class="header-spacer" /></template>
  </header>
  <slot name="identity" />
  <div class="mobile-content">
   <div v-if="standalone&&!ownerRoot" class="mobile-account"><span>{{side==='staff'?'员工端':'业主端'}}</span><van-button plain size="small" :loading="loggingOut" @click="signOut"><LogoutOutlined />退出登录</van-button></div>
   <MobileNotice v-if="error" type="error" :message="error" show-icon><template #action><van-button v-if="!invalid" @click="start">重试</van-button></template></MobileNotice>
   <template v-if="!invalid">
    <div v-if="view==='list'&&side==='staff'" class="mobile-project"><HomeOutlined /><ProjectTreeSelect :value="projectId||undefined" :tree-data="projects" :allow-clear="true" :disabled="loading" placeholder="全部有权项目" @update:value="changeProject" /></div>
    <OwnerHome v-if="view==='list'&&side==='owner'" :houses="houses" :selected-id="householdId" :loading="loading" :failed="!!error" :rows="rows" :page="page" :total="total" @apply="navigate('create')" @refresh="refresh" @open="id=>navigate('workflow',id)" @page="changePage" />
    <StaffHome v-else-if="view==='list'" :tasks="taskRows" :notices="notices" :failed="!!error" :tab="staffTab" :loading="loading" :total="total" :page="page" @tab="changeTab" @page="changePage" @notice="openNotice" @open="task=>navigate('detail',task.decorationId,'overview',task.id)" />
    <OwnerRecords v-else-if="view==='history'" :rows="rows" :loading="loading" :failed="!!error" :page="page" :total="total" @open="id=>navigate('workflow',id)" @page="changePage" />
    <OwnerNotifications v-else-if="view==='notifications'" :rows="notices" :loading="loading" :failed="!!error" :page="page" :total="total" @open="openNotice" @page="changePage" />
    <OwnerWorkflow v-else-if="view==='workflow'&&current" :current="current" :rectification-count="rectificationCount" :loading="loading" @step="openStep" @rectification="navigate('detail',current.id,'rectification')" />
    <MobileLoading v-else-if="view==='workflow'" :loading="loading" />
    <OwnerApplicationForm v-else-if="view==='create'&&side==='owner'&&household" :key="contextKey+householdId" ref="form" :api="api" :household="household" @submitted="created" />
    <OwnerApplicationDetail v-else-if="view==='detail'&&side==='owner'" :key="contextKey+detailId+detailStep" ref="detail" :id="detailId" :api="api" :step="detailStep" @changed="applicationChanged" @step="openStep" @restart="navigate('list')" />
    <StaffTaskDetail v-else-if="view==='detail'" :key="contextKey+taskId" ref="detail" :api="api" :id="detailId" :task-id="taskId" :permissions="permissions" @changed="load" />
   </template>
  </div>
  <nav v-if="ownerRoot&&!invalid" class="owner-bottom-nav" :aria-label="t('Mobile.ownerNavigation')">
   <van-button plain :class="{active:ownerTab==='list'}" :aria-current="ownerTab==='list'?'page':undefined" @click="view!=='list'&&navigate('list')"><FileAddOutlined /><span>{{t('Mobile.houseApplications')}}</span></van-button>
   <van-button plain :class="{active:ownerTab==='history'}" :aria-current="ownerTab==='history'?'page':undefined" @click="view!=='history'&&navigate('history')"><FileTextOutlined /><span>{{t('Mobile.decorationRecords')}}</span></van-button>
   <van-button plain :class="{active:ownerTab==='notifications'}" :aria-current="ownerTab==='notifications'?'page':undefined" @click="view!=='notifications'&&navigate('notifications')"><BellOutlined /><span>{{t('Mobile.decorationNotifications')}}</span></van-button>
  </nav>
 </main></van-config-provider>
</template>

<style scoped>
.mobile-header .header-action {
 width: 42px;
 height: 42px;
 flex-shrink: 0;
 padding: 0;
 display: flex;
 align-items: center;
 justify-content: center;
 border: 0;
 border-radius: 50%;
 background: transparent;
 color: var(--mobile-text);
 box-shadow: none;
}
.header-action :deep(.van-button__text) { display: flex; align-items: center; justify-content: center; }
.header-action :deep(.van-icon) { font-size: 20px; line-height: 1; }
.header-action:active { background: #dfeeff; }
.header-action:focus-visible { outline: 2px solid var(--mobile-blue); outline-offset: -4px; }
</style>
