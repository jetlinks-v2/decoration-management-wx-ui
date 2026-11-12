<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { Pagination as VanPagination } from 'vant'
import MobileLoading from './ui/MobileLoading.vue'

import { useI18n } from '../i18n'
const { t } = useI18n()
import {FileTextOutlined,HomeOutlined,RightOutlined,ClockCircleOutlined} from './ui/icons'
import type {OwnerApplicationSummary} from '../../types/decoration'
import {workflowStatus} from '../../utils/decoration'
import {dateText} from '../model'
defineProps<{rows:OwnerApplicationSummary[];loading:boolean;failed:boolean;page:number;total:number;ongoing?:boolean;occupied?:boolean}>()
const emit=defineEmits<{open:[id:string];page:[value:number]}>()
</script>
<template>
 <div v-if="ongoing" class="mobile-section-heading"><h2>{{t('Mobile.processingApplications')}}</h2></div>
 <section v-else class="owner-list-intro"><span class="owner-list-icon"><FileTextOutlined /></span><div><h2>{{t('Mobile.decorationRecords')}}</h2><p>{{t('Mobile.recordsEntryDescription')}}</p></div></section>
 <MobileLoading :loading="loading">
  <van-empty v-if="!rows.length&&!loading&&!failed" :description="t(ongoing?occupied?'Mobile.processingApplicationUnavailable':'Mobile.noProcessingApplications':'Mobile.noDecorationRecords')" />
  <section v-for="row in rows" :key="row.id" class="mobile-surface owner-record owner-record--clickable" role="button" :tabindex="loading?-1:0" :aria-disabled="loading" :aria-label="`${row.number}，${t('Mobile.openApplication')}`" @click="!loading&&emit('open',row.id)" @keydown.enter.self.prevent="!loading&&emit('open',row.id)" @keydown.space.self.prevent="!loading&&emit('open',row.id)">
   <div class="staff-task-head"><span class="owner-record-type"><FileTextOutlined />{{t(row.decorationType==='first'?'Mobile.firstDecoration':'Mobile.secondDecoration')}}</span><span class="status-pill" :class="{warning:row.status==='rejected'||row.status.includes('failed')}">{{t(`Decoration.states.${workflowStatus(row)}`)}}</span></div>
   <h3><HomeOutlined />{{row.spaceName}}</h3>
   <p class="owner-record-number">{{t('Mobile.applicationNumber')}}：{{row.number}}</p>
   <div class="owner-record-footer"><span><ClockCircleOutlined />{{t('Mobile.applicationDate')}} {{dateText(row.createTime)}}</span><van-button plain :disabled="loading" @click.stop="emit('open',row.id)">{{t(ongoing?'Mobile.continueApplication':'Mobile.viewDetail')}}<RightOutlined /></van-button></div>
  </section>
  <van-pagination v-if="total>10" :model-value="page" :total="total" :items-per-page="10" simple :disabled="loading" @change="value=>emit('page',value)" />
 </MobileLoading>
</template>
