<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import MobileLoading from './ui/MobileLoading.vue'

import { useI18n } from '../i18n'
const { t } = useI18n()
import {computed} from 'vue'
import {HomeOutlined,RightOutlined,ToolOutlined,ReloadOutlined} from './ui/icons'
import ownerScene from '../assets/owner-scene.svg'
import OwnerRecords from './OwnerRecords.vue'
import type {OwnerHouse,OwnerApplicationSummary} from '../../types/decoration'
const props=defineProps<{houses:OwnerHouse[];selectedId:string;loading:boolean;failed?:boolean;rows:OwnerApplicationSummary[];page:number;total:number}>()
const emit=defineEmits<{apply:[];refresh:[];open:[id:string];page:[value:number]}>()
const processing=computed(()=>props.houses.filter(home=>home.processing).length)
const selected=computed(()=>props.houses.find(home=>home.household.relationshipId===props.selectedId))
</script>
<template>
 <section class="owner-welcome"><span>{{t('Mobile.ownerSide')}}</span><h2>{{t('Mobile.ownerWelcome')}}</h2><p>{{t('Mobile.ownerWelcomeHint')}}</p></section>
 <section class="decoration-hero decoration-hero--owner owner-home-hero"><div><span class="hero-eyebrow">{{t('Mobile.houseApplicationsTitle')}}</span><h2>{{t('Mobile.ownerHeroTitle')}}</h2><p>{{t('Mobile.ownerHeroHint')}}</p><van-button class="owner-hero-action" :disabled="loading||failed||!selected||selected.processing" @click="emit('apply')">{{!selected?t('Mobile.chooseHouseFirst'):selected.processing?t('Mobile.houseProcessing'):t('Mobile.startApplication')}}<RightOutlined /></van-button></div><img :src="ownerScene" alt="" width="320" height="240" /></section>
 <MobileLoading :loading="loading">
  <template v-if="!failed">
   <div class="mobile-section-heading"><h2>{{t('Mobile.houseStatistics')}}</h2><van-button plain size="small" :loading="loading" @click="emit('refresh')"><ReloadOutlined />{{t('Mobile.refresh')}}</van-button></div>
   <section class="owner-house-stats" :aria-label="t('Mobile.houseStatistics')">
    <div><span class="owner-stat-label"><HomeOutlined />{{t('Mobile.myHouses')}}</span><strong>{{loading?'—':houses.length}}<small>{{t('Mobile.houseUnit')}}</small></strong></div>
    <div><span class="owner-stat-label"><ToolOutlined />{{t('Mobile.processingHouses')}}</span><strong>{{loading?'—':processing}}<small>{{t('Mobile.houseUnit')}}</small></strong></div>
   </section>
   <section v-if="selected||!houses.length&&!loading" class="mobile-surface owner-current-house">
    <div v-if="selected" class="owner-selected-house"><span class="owner-house-icon"><HomeOutlined /></span><div><span>{{selected.projectName}}</span><strong>{{selected.household.spaceName}}</strong></div><span class="owner-house-state" :class="{processing:selected.processing}">{{selected.processing?t('Mobile.houseProcessing'):selected.applicationCount?t('Mobile.houseCompleted'):t('Mobile.houseNotApplied')}}</span></div>
    <van-empty v-if="!houses.length&&!loading" :description="t('Mobile.noOwnerHouses')" />
    <p v-if="selected?.processing" class="owner-selection-hint">{{t('Mobile.continueHouseApplication')}}</p>
   </section>
  </template>
 </MobileLoading>
 <OwnerRecords v-if="selected" :rows="rows" ongoing :occupied="selected.processing" :loading="loading" :failed="!!failed" :page="page" :total="total" @open="id=>emit('open',id)" @page="value=>emit('page',value)" />
</template>
