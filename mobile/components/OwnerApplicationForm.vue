<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import { Field as VanField } from 'vant'
import { RadioGroup as VanRadioGroup } from 'vant'
import { Radio as VanRadio } from 'vant'
import { Checkbox as VanCheckbox } from 'vant'
import MobileNotice from './ui/MobileNotice.vue'
import MobileLoading from './ui/MobileLoading.vue'
import BusinessField from './ui/BusinessField.vue'
import BusinessForm from './ui/BusinessForm.vue'

import { useI18n } from '../i18n'
const { t } = useI18n()
import dayjs from 'dayjs'
import {HomeOutlined,CheckOutlined} from './ui/icons'
import type {DecorationApi} from '../../services/decorationApi'
import type {Application,Household} from '../../types/decoration'
import {useOwnerApplicationForm} from '../../hooks/decoration/useOwnerApplicationForm'
import SelfInspectionForm from '../../components/decoration/SelfInspectionForm.vue'
import ApplicationMaterials from '../../components/decoration/ApplicationMaterials.vue'
import MaterialSigning from '../../components/decoration/MaterialSigning.vue'
const props=defineProps<{api:DecorationApi;household:Household}>()
const emit=defineEmits<{submitted:[Application]}>()
const {form,configuration,loading,saving,uploading,error,uncertain,resultMissing,confirmResult,retryOriginal,step,materialIndex,materials,currentMaterial,materialSigned,editMaterial,busy,dirty,dates,next,back,submit}=useOwnerApplicationForm(props.api,()=>props.household,row=>emit('submitted',row))
defineExpose({dirty,saving:busy,uncertain})
</script>
<template>
 <div class="form-house mobile-surface"><HomeOutlined /><div><strong>{{household.spaceName}}</strong><p>申请业主：{{household.customerName}}</p></div></div>
 <div class="mobile-form-steps"><div v-for="(label,index) in ['申请信息','装修自检','装修图纸','资料签署']" :key="label" :class="{active:step===index,done:step>index}"><span><CheckOutlined v-if="step>index" /><template v-else>{{index+1}}</template></span><p>{{label}}</p></div></div>
 <MobileNotice v-if="error" type="error" :message="error" show-icon />
 <MobileNotice v-if="uncertain" type="warning" message="申请结果待确认，请先核对结果。"><template #action><van-button @click="confirmResult">核对结果</van-button><van-button v-if="resultMissing" :loading="saving" @click="retryOriginal">重试原申请</van-button></template></MobileNotice>
 <MobileLoading :loading="loading">
  <van-empty v-if="!configuration&&!loading&&!error" description="暂无适用装修配置，请联系物业" />
  <BusinessForm :model="form" v-if="configuration" layout="vertical" class="mobile-form" :disabled="busy||uncertain" @submit="submit">
   <template v-if="step===0">
    <section class="mobile-surface"><h2>装修申请信息</h2><BusinessField label="装修类型" required><van-radio-group v-model="form.decorationType"><van-radio name="first">首次装修</van-radio><van-radio name="second">二次装修</van-radio></van-radio-group></BusinessField><BusinessField label="业主联系电话" required><van-field v-model="form.contactPhone" type="tel" placeholder="请输入联系电话" /></BusinessField><BusinessField label="业主身份证号码" required><van-field v-model="form.ownerCertificate" placeholder="请输入证件号码" /></BusinessField><div class="mobile-date-row"><BusinessField label="开工日期" required><van-field type="date" :model-value="dates.start" @update:model-value="v=>form.startTime=v?dayjs(v).valueOf():undefined" /></BusinessField><BusinessField label="计划竣工日期" required><van-field type="date" :model-value="dates.end" @update:model-value="v=>form.completionTime=v?dayjs(v).endOf('day').valueOf():undefined" /></BusinessField></div></section>
    <section class="mobile-surface"><h2>施工方信息</h2><BusinessField label="施工类型" required><van-radio-group v-model="form.constructionType"><van-radio :name="1">装修公司</van-radio><van-radio :name="2">自装</van-radio></van-radio-group></BusinessField><BusinessField label="施工单位 / 公司" required><van-field v-model="form.constructionUnit" placeholder="请输入施工单位" /></BusinessField><BusinessField label="施工负责人" required><van-field v-model="form.constructionManager" placeholder="请输入负责人姓名" /></BusinessField><BusinessField label="负责人联系电话" required><van-field v-model="form.managerPhone" type="tel" placeholder="请输入联系电话" /></BusinessField><BusinessField label="负责人身份证号码" required><van-field v-model="form.managerCertificate" /></BusinessField></section>
    <section class="mobile-surface agreement-section">
     <h2>{{t('Decoration.agreement')}}</h2>
     <p>{{configuration.agreement.content}}</p>
     <div v-for="(item,index) in configuration.agreement.supplements" :key="index"><h3>{{item.name}}</h3><p>{{item.content}}</p></div>
     <div class="deposit-note">{{t('Mobile.agreementDeposit')}}<strong>¥{{configuration.agreement.deposit}}</strong><small>{{t('Mobile.agreementDepositHint')}}</small></div>
     <div v-if="Object.keys(configuration.agreement.fees||{}).length" class="agreement-fees"><h3>{{t('Mobile.agreementOtherFees')}}</h3><dl><template v-for="(amount,name) in configuration.agreement.fees" :key="name"><dt>{{name}}</dt><dd>¥{{amount}}</dd></template></dl></div>
    </section>
    <div class="mobile-consent"><van-checkbox v-model="form.noticesAccepted">我已阅读并确认以上装修须知和协议</van-checkbox></div>
   </template>
   <template v-else-if="step===1"><section class="mobile-surface"><SelfInspectionForm :api="api" :form="form" :configuration="configuration" :disabled="busy||uncertain" /></section></template>
   <template v-else-if="step===2"><section class="mobile-surface"><ApplicationMaterials :api="api" :form="form" :configuration="configuration" kind="drawing" :disabled="busy||uncertain" /></section></template>
   <template v-else>
    <section v-if="currentMaterial" class="mobile-surface"><p class="muted">第 {{materialIndex+1}} / {{materials.length}} 份资料{{currentMaterial.required?'（必签）':'（可跳过）'}}</p><MaterialSigning :key="currentMaterial.id" :api="api" :form="form" :configuration="configuration" :item="currentMaterial" :disabled="busy||uncertain" /></section>
    <section v-else class="mobile-surface"><h2>资料签署完成</h2><p v-if="!materials.length" class="muted">本项目无需签署装修资料。</p><div v-for="(item,index) in materials" :key="item.id" class="staff-task-head"><span>{{item.name}} · {{materialSigned(item.id)?'已签署':'未签署'}}</span><van-button plain :disabled="busy||uncertain" @click="editMaterial(index)">查看 / 重签</van-button></div></section>
   </template>
   <div class="mobile-bottom-actions"><van-button v-if="step>0" size="large" :disabled="busy||uncertain" @click="back">上一步</van-button><van-button v-if="step<3||currentMaterial" type="primary" size="large" :disabled="busy||uncertain" @click="next">{{step===3?(currentMaterial&&!currentMaterial.required&&!materialSigned(currentMaterial.id)?'跳过此资料':'下一份资料'):'下一步'}}</van-button><van-button v-else type="primary" size="large" native-type="submit" :loading="saving" :disabled="uploading||uncertain">确认并提交申请</van-button></div>
  </BusinessForm>
 </MobileLoading>
</template>
