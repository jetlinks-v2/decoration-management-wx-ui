<script setup lang="ts">
import { Empty as VanEmpty } from 'vant'
import { Tabs as VanTabs } from 'vant'
import { Tab as VanTab } from 'vant'
import MobileNotice from '../../mobile/components/ui/MobileNotice.vue'
import DetailFields from '../../mobile/components/ui/DetailFields.vue'
import DetailField from '../../mobile/components/ui/DetailField.vue'
import RecordList from '../../mobile/components/ui/RecordList.vue'

import {useI18n} from '../../mobile/i18n'
import type {Application} from '../../types/decoration'
import type {DecorationApi} from '../../services/decorationApi'
import FilePicker from './FilePicker.vue'
defineProps<{row:Application;api:DecorationApi}>()
const {t}=useI18n()
const label=(key:string)=>t(`Decoration.permitDetail.${key}`)
const date=(time?:number)=>time?new Date(time).toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'}):'—'
</script>
<template>
 <template v-if="row.permit">
  <DetailFields :title="label('operators')" :column="{xs:1,lg:2}" class="detail-fields" size="small">
   <DetailField :label="label('issuer')">{{row.permit.approverName||label('unrecorded')}}</DetailField>
   <DetailField :label="label('issuerPhone')">{{row.permit.approverPhone||label('unrecorded')}}</DetailField>
   <DetailField :label="label('printOperator')">{{row.permit.prints?.filter(record=>record.outputType!=='download'&&record.endTime===row.permit?.endTime).at(-1)?.operatorName||(row.permit.printTime?label('unrecorded'):'—')}}</DetailField>
   <DetailField :label="label('printTime')">{{date(row.permit.printTime)}}</DetailField>
   <DetailField :label="label('downloadTime')">{{date(row.permit.downloadTime)}}</DetailField>
   <DetailField :label="label('downloadOperator')">{{row.permit.prints?.filter(record=>record.outputType==='download'&&record.endTime===row.permit?.endTime).at(-1)?.operatorName||'—'}}</DetailField>
  </DetailFields>
  <MobileNotice v-if="row.permit.legacyPrintTime||row.permit.printTime&&!row.permit.prints?.length" type="info" :message="t('Decoration.permitDetail.legacyPrint',{time:date(row.permit.legacyPrintTime||row.permit.printTime)})" show-icon style="margin-top:1rem" />
  <van-tabs>
  <van-tab name="prints" :title="`${label('prints')}（${row.permit.prints?.length||0}）`">
  <RecordList size="small" :data-source="[...(row.permit.prints||[])].reverse()" :pagination="false" :row-key="(_row:unknown,index?:number)=>index??0" :columns="[{title:label('outputType'),key:'outputType'},{title:label('outputTime'),key:'time'},{title:label('operator'),dataIndex:'operatorName'},{title:label('versionEnd'),key:'endTime'},{title:label('printSnapshot'),key:'snapshot'}]">
   <template #bodyCell="{column,record}"><template v-if="column.key==='outputType'">{{label(record.outputType==='download'?'download':'print')}}</template><template v-else-if="['time','endTime'].includes(String(column.key))">{{date(record[column.key as keyof typeof record] as number | undefined)}}</template><FilePicker v-else-if="column.key==='snapshot'" :value="[record.snapshotFileId]" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly label="" /></template>
  </RecordList>
  </van-tab>
  <van-tab v-if="row.permit.collections?.length" name="collections" :title="`${label('collections')}（${row.permit.collections?.length||0}）`">
  <RecordList size="small" :data-source="[...(row.permit.collections||[])].reverse()" :pagination="false" :row-key="(_row:unknown,index?:number)=>index??0" :columns="[{title:label('collectionTime'),key:'collectedTime'},{title:label('collector'),dataIndex:'collectedBy'},{title:label('collectionOperator'),dataIndex:'operatorName'},{title:label('versionEnd'),key:'endTime'},{title:label('collectedSnapshot'),key:'snapshot'}]">
   <template #bodyCell="{column,record}"><template v-if="['collectedTime','endTime'].includes(String(column.key))">{{date(record[column.key as keyof typeof record] as number | undefined)}}</template><FilePicker v-else-if="column.key==='snapshot'" :value="[record.snapshotFileId]" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly label="" /></template>
  </RecordList>
  </van-tab>
  <van-tab name="extensions" :title="`${label('extensions')}（${row.permit.extensions?.length||0}）`">
  <RecordList size="small" :data-source="[...(row.permit.extensions||[])].reverse()" :pagination="false" :row-key="(_row:unknown,index?:number)=>index??0" :columns="[{title:label('extensionTime'),key:'time'},{title:label('operator'),dataIndex:'actorName'},{title:label('months'),dataIndex:'months'},{title:label('beforeEnd'),key:'beforeEndTime'},{title:label('afterEnd'),key:'afterEndTime'}]">
   <template #bodyCell="{column,record}"><template v-if="['time','beforeEndTime','afterEndTime'].includes(String(column.key))">{{date(record[column.key as keyof typeof record] as number | undefined)}}</template></template>
  </RecordList>
  </van-tab>
  </van-tabs>
 </template>
 <van-empty v-else :description="label('noPermitRecords')" />
</template>
