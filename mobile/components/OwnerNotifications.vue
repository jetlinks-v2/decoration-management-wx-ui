<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { Pagination as VanPagination } from 'vant'
import MobileLoading from './ui/MobileLoading.vue'

import { useI18n } from '../i18n'
const { t } = useI18n()
import {BellOutlined,HomeOutlined,RightOutlined,ClockCircleOutlined} from './ui/icons'
import type {DecorationNotice} from '../../types/decoration'
import {dateText} from '../model'
defineProps<{rows:DecorationNotice[];loading:boolean;failed:boolean;page:number;total:number}>()
const emit=defineEmits<{open:[notice:DecorationNotice];page:[value:number]}>()
</script>
<template>
 <section class="owner-list-intro"><span class="owner-list-icon"><BellOutlined /></span><div><h2>{{t('Mobile.decorationNotifications')}}</h2><p>{{t('Mobile.notificationsHint')}}</p></div></section>
 <MobileLoading :loading="loading">
  <van-empty v-if="!rows.length&&!loading&&!failed" :description="t('Mobile.noDecorationNotifications')" />
  <section v-for="notice in rows" :key="notice.id" class="mobile-surface owner-record owner-notice owner-record--clickable" role="button" :tabindex="loading?-1:0" :aria-disabled="loading" :aria-label="`${notice.message}，${t('Mobile.viewDetail')}`" @click="!loading&&emit('open',notice)" @keydown.enter.self.prevent="!loading&&emit('open',notice)" @keydown.space.self.prevent="!loading&&emit('open',notice)">
   <div class="staff-task-head"><span class="owner-record-type"><BellOutlined />{{notice.title}}</span></div>
   <h3><HomeOutlined />{{notice.spaceName}}</h3><p class="owner-notice-description">{{notice.message}}</p>
   <p class="owner-record-number">{{t('Mobile.applicationNumber')}}：{{notice.number}}</p>
   <div class="owner-record-footer"><span><ClockCircleOutlined />{{dateText(notice.createTime)}}</span><van-button plain :disabled="loading" @click.stop="emit('open',notice)">{{t('Mobile.viewDetail')}}<RightOutlined /></van-button></div>
  </section>
  <van-pagination v-if="total>10" :model-value="page" :total="total" :items-per-page="10" simple :disabled="loading" @change="value=>emit('page',value)" />
 </MobileLoading>
</template>
