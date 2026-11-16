<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { Pagination as VanPagination } from 'vant'
import MobileLoading from './ui/MobileLoading.vue'

import { useI18n } from '../i18n'
const { t } = useI18n()
import {RightOutlined,EnvironmentOutlined,ClockCircleOutlined} from './ui/icons'
import OwnerNotifications from './OwnerNotifications.vue'
import type {DecorationNotice,Task} from '../../types/decoration'
import {taskNames,taskStates,dateText,type StaffTab} from '../model'
defineProps<{tasks:Task[];tab:StaffTab;loading:boolean;total:number;page:number;notices:DecorationNotice[];failed:boolean}>()
const emit=defineEmits<{tab:[StaffTab];open:[Task];page:[number];notice:[DecorationNotice]}>()
</script>
<template>
 <div v-if="tab!=='history'&&tab!=='notifications'" class="staff-tabs" role="tablist" :aria-label="t('Mobile.taskCategories')"><van-button v-for="item in [{key:'all',name:t('Mobile.allTasks')},{key:'inspection',name:t('Mobile.inspectionTasks')},{key:'acceptance',name:t('Mobile.acceptanceTasks')}]" :key="item.key" role="tab" :aria-selected="tab===item.key" :class="{selected:tab===item.key}" @click="emit('tab',item.key as StaffTab)">{{item.name}}</van-button></div>
 <OwnerNotifications v-if="tab==='notifications'" :rows="notices" :loading="loading" :failed="failed" :page="page" :total="total" staff @open="emit('notice',$event)" @page="emit('page',$event)" />
 <template v-else>
 <div class="mobile-section-heading"><h2>{{tab==='history'?t('Mobile.staffHistory'):t('Mobile.myTasks')}}</h2><span class="muted">{{t('Mobile.taskCount',{count:total})}}</span></div>
 <MobileLoading :loading="loading"><van-empty v-if="!tasks.length&&!loading" :description="tab==='history'?'暂无办理记录':'当前没有待办任务'" />
  <article v-for="task in tasks" :key="task.id" class="mobile-surface staff-task" role="button" tabindex="0" @click="emit('open',task)" @keydown.enter="emit('open',task)">
   <div class="staff-task-head"><span class="task-kind">{{task.status==='waiting_review'?'整改复核':taskNames[task.kind]}}</span><span class="status-pill" :class="{warning:task.status==='pending'||task.status==='waiting_review'}">{{taskStates[task.status]||task.status}}</span></div>
   <h3>{{task.spaceName||'房屋信息待完善'}}</h3><p><EnvironmentOutlined /> {{task.projectName||'—'}} · {{task.ownerName||'—'}}</p><p><ClockCircleOutlined /> {{task.kind==='daily'?task.details.scheduledDate||dateText(task.createTime):dateText(task.acceptanceDate||task.modifyTime)}}</p>
   <div class="staff-task-footer"><span>{{task.assigneeName||task.details.inspectionRoles?.map(r=>r.roleName).join('、')||'角色任务'}}</span><span class="primary-text">{{tab==='history'?'查看记录':'去办理'}} <RightOutlined /></span></div>
  </article>
 </MobileLoading>
 <van-pagination v-if="total>10" :model-value="page" :total="total" :items-per-page="10" simple @change="emit('page',$event)" />
 </template>
</template>
