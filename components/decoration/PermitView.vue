<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { Tabs as VanTabs } from 'vant'
import { Tab as VanTab } from 'vant'
import { Image as VanImage } from 'vant'
import MobileNotice from '../../mobile/components/ui/MobileNotice.vue'
import MobileLoading from '../../mobile/components/ui/MobileLoading.vue'
import DetailFields from '../../mobile/components/ui/DetailFields.vue'
import DetailField from '../../mobile/components/ui/DetailField.vue'
import RecordList from '../../mobile/components/ui/RecordList.vue'
import ResultNotice from '../../mobile/components/ui/ResultNotice.vue'

import {computed,ref} from 'vue'
import {useI18n} from '../../mobile/i18n'
import type {Application} from '../../types/decoration'
import type {DecorationApi} from '../../services/decorationApi'
import {usePermitSnapshot} from '../../hooks/decoration/usePermitSnapshot'
import PermitRecords from './PermitRecords.vue'
const props=defineProps<{row:Application;api:DecorationApi}>()
const {t}=useI18n()
const label=(key:string)=>t(`Decoration.permitDetail.${key}`)
const tab=ref('certificate')
const latest=computed(()=>props.row.permit?.prints?.at(-1))
const registration=computed(()=>props.row.details.workerRegistration)
const construction=computed(()=>registration.value||props.row.permit)
const workers=computed(()=>registration.value?.workers||props.row.permit?.workers||[])
const snapshot=usePermitSnapshot(props.api,()=>latest.value?.snapshotFileId)
const date=(time?:number)=>time?new Date(time).toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'}):'—'
</script>
<template>
 <van-tabs v-model:active="tab">
  <van-tab name="certificate" :title="label('certificate')">
   <template v-if="row.permit">
    <MobileNotice v-if="latest&&latest.endTime!==row.permit.endTime" type="info" :message="label('oldSnapshot')" show-icon />
    <div class="certificate-layout">
     <section class="certificate-image">
      <MobileLoading :loading="snapshot.loading.value"><van-image v-if="snapshot.url.value" :src="snapshot.url.value" :alt="label('snapshot')" :width="'100%'" style="max-height:27.5rem;object-fit:contain" /></MobileLoading>
      <MobileNotice v-if="snapshot.error.value" type="error" :message="snapshot.error.value"><template #action><van-button @click="snapshot.load">{{t('Decoration.retry')}}</van-button></template></MobileNotice>
      <van-empty v-if="!latest" :description="label('noSnapshot')" />
     </section>
     <DetailFields class="detail-fields" :column="1" size="small">
      <DetailField :label="label('number')">{{row.permit.number}}</DetailField>
      <DetailField :label="label('project')">{{row.projectName}}</DetailField>
      <DetailField :label="label('house')">{{row.spaceName}}</DetailField>
      <DetailField :label="label('owner')">{{row.ownerName||'—'}}</DetailField><DetailField :label="t('Decoration.detailFields.phone')">{{row.contactPhone||'—'}}</DetailField>
      <DetailField :label="label('unit')">{{row.details.constructionUnit}}</DetailField>
      <DetailField :label="label('safety')">{{row.permit.safetyPerson||'—'}}</DetailField><DetailField :label="t('Decoration.detailFields.safetyPhone')">{{row.permit.safetyPhone||'—'}}</DetailField>
      <DetailField :label="label('content')">{{row.permit.content}}</DetailField>
      <DetailField :label="label('validity')">{{date(row.permit.startTime)}} 至 {{date(row.permit.endTime)}}</DetailField>
      <DetailField :label="label('collectionStatus')">{{label(row.permit.downloadTime||row.permit.printTime?'outputCompleted':row.permit.collectedTime?'legacyIssued':'pendingPrint')}}</DetailField>
     </DetailFields>
    </div>
   </template>
   <ResultNotice v-else :status="registration?'info':'warning'" :title="label(registration?'registered':'notRegistered')" :sub-title="label(registration?'generateHint':'registerHint')" />
  </van-tab>
  <van-tab name="workers" :title="t('Decoration.permitDetail.workers',{count:workers.length})">
   <DetailFields :title="label('constructionInfo')" size="small" :column="{xs:1,lg:2}" class="detail-fields" style="margin:1rem 0">
    <DetailField :label="label('unit')">{{row.details.constructionUnit||'—'}}</DetailField>
    <DetailField :label="label('manager')">{{row.details.constructionManager||'—'}}</DetailField><DetailField :label="t('Decoration.detailFields.managerPhone')">{{row.details.managerPhone||'—'}}</DetailField>
    <DetailField :label="label('safety')">{{construction?.safetyPerson||'—'}}</DetailField><DetailField :label="t('Decoration.detailFields.safetyPhone')">{{construction?.safetyPhone||'—'}}</DetailField>
    <DetailField :label="label('entrusted')">{{construction?label(construction.entrusted?'yes':'no'):'—'}}</DetailField>
    <DetailField :label="label('content')" :span="2">{{construction?.content||'—'}}</DetailField>
   </DetailFields>
   <DetailFields :title="label('registrationInfo')" size="small" :column="{xs:1,lg:2}" class="detail-fields" style="margin:1.5rem 0">
    <DetailField :label="label('registrar')">{{registration?.operatorName||label('unrecorded')}}</DetailField>
    <DetailField :label="label('registrationTime')">{{date(registration?.time)}}</DetailField>
   </DetailFields>
   <h4>{{label('workerList')}}</h4>
   <RecordList :data-source="workers" :pagination="false" size="small" :row-key="(_row:unknown,index?:number)=>index??0" :columns="[{title:label('name'),dataIndex:'name'},{title:label('certificateNumber'),dataIndex:'certificate'},{title:label('phone'),dataIndex:'phone'},{title:label('entry'),key:'entryTime'},{title:label('expiry'),key:'expirationTime'}]">
    <template #bodyCell="{column,record}"><template v-if="['entryTime','expirationTime'].includes(String(column.key))">{{date(record[column.key as keyof typeof record] as number | undefined)}}</template></template>
    <template #emptyText><van-empty :description="label('noWorkers')" /></template>
   </RecordList>
  </van-tab>
  <van-tab name="records" :title="label('records')"><PermitRecords :row="row" :api="api" /></van-tab>
 </van-tabs>
</template>
<style scoped>
.certificate-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(20rem,1fr);gap:1.25rem;margin-top:1rem;align-items:start}.certificate-image{background:var(--ant-color-fill-alter,#fafafa);border:1px solid var(--ant-color-border-secondary,#f0f0f0);padding:0.75rem;min-height:15rem;display:flex;flex-direction:column;justify-content:center}@media(max-width:62.5rem){.certificate-layout{grid-template-columns:1fr}}
</style>
