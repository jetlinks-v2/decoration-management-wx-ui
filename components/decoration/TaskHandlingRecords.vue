<script setup lang="ts">
import { CollapseItem as VanCollapseItem } from 'vant'
import { Step as VanStep } from 'vant'
import BusinessCollapse from '../../mobile/components/ui/BusinessCollapse.vue'
import BusinessTimeline from '../../mobile/components/ui/Timeline.vue'
import DetailFields from '../../mobile/components/ui/DetailFields.vue'
import DetailField from '../../mobile/components/ui/DetailField.vue'

import {useI18n} from '../../mobile/i18n'
import type {Application,TaskHandlingRecord} from '../../types/decoration'
import type {DecorationApi} from '../../services/decorationApi'
import FilePicker from './FilePicker.vue'
defineProps<{records:TaskHandlingRecord[];row:Application;api:DecorationApi}>()
const {t}=useI18n()
const labels={auditViolation:'整改通知审核',submitRectification:'提交整改',reviewRectification:'整改复核',reassignReviewRole:'重新指派复核角色',resendRectification:'重发整改任务'}
</script>
<template>
  <BusinessCollapse v-if="records.length" ghost>
    <van-collapse-item name="handling" title="整改办理记录">
      <BusinessTimeline>
        <van-step v-for="(record,index) in records" :key="index">
          <DetailFields class="detail-fields" :column="{xs:1,lg:2}" size="small">
            <DetailField :label="t('Decoration.detailFields.action')">{{labels[record.action]}}</DetailField><DetailField :label="t('Decoration.detailFields.taskState')">{{t(`Decoration.taskStates.${record.status}`)}}</DetailField>
            <DetailField :label="t('Decoration.detailFields.operator')">{{record.operatorName||'—'}}</DetailField><DetailField :label="t('Decoration.detailFields.time')">{{new Date(record.time).toLocaleString()}}</DetailField>
            <DetailField v-if="record.reviewRoleName" :label="t('Decoration.detailFields.reviewRole')">{{record.reviewRoleName}}</DetailField><DetailField :label="t('Decoration.detailFields.feedback')" :span="2">{{record.remark||'—'}}</DetailField>
            <DetailField v-if="record.fileIds.length" :label="t('Decoration.detailFields.attachments')" :span="2"><FilePicker :value="record.fileIds" :api="api" :project-id="row.projectId" :decoration-id="row.id" readonly /></DetailField>
          </DetailFields>
        </van-step>
      </BusinessTimeline>
    </van-collapse-item>
  </BusinessCollapse>
</template>
