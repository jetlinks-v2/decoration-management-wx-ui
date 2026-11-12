<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Empty as VanEmpty } from 'vant'
import MobileNotice from './ui/MobileNotice.vue'
import MobileLoading from './ui/MobileLoading.vue'

import {computed,ref} from 'vue'
import type {DecorationApi} from '../../services/decorationApi'
import type {Action} from '../../types/decoration'
import {useApplicationDetail} from '../../hooks/decoration/useApplicationDetail'
import MobileTaskRecord from './MobileTaskRecord.vue'
const props=defineProps<{api:DecorationApi;id:string;taskId:string;permissions:Record<string,boolean>}>()
const emit=defineEmits<{changed:[]}>()
const {row,tasks,loading,saving,uploading,error,uncertain,resultMissing,confirm,retryOriginal,load,execute}=useApplicationDetail(props.api,()=>props.id,()=>props.taskId)
const editor=ref<{dirty:boolean}>(),dirty=computed(()=>!!editor.value?.dirty),busy=computed(()=>saving.value||uploading.value||uncertain.value)
async function submit(name:string,input:Partial<Action>,task:boolean){if(await execute(name,input,task))emit('changed')}
defineExpose({dirty,saving:busy,uncertain,reload:load})
</script>
<template>
 <MobileLoading :loading="loading">
  <MobileNotice v-if="error" type="error" :message="error" show-icon><template #action><van-button :disabled="busy" @click="load">重试</van-button></template></MobileNotice>
  <MobileNotice v-if="uncertain" type="warning" message="办理结果待确认，请先核对结果。"><template #action><van-button :loading="saving" @click="confirm">核对结果</van-button><van-button v-if="resultMissing" :loading="saving" @click="retryOriginal">重试原操作</van-button></template></MobileNotice>
  <template v-if="row"><section class="mobile-surface"><span class="current-pill">{{row.projectName}}</span><h2 class="detail-house-name">{{row.spaceName}}</h2><dl><dt>业主</dt><dd>{{row.ownerName}}</dd><dt>联系电话</dt><dd><a :href="`tel:${row.contactPhone}`">{{row.contactPhone}}</a></dd><dt>施工负责人</dt><dd>{{row.details.constructionManager}}</dd><dt>负责人电话</dt><dd><a :href="`tel:${row.details.managerPhone}`">{{row.details.managerPhone}}</a></dd></dl></section>
   <MobileTaskRecord v-if="tasks[0]" :key="tasks[0].id" ref="editor" :task="tasks[0]" :row="row" :api="api" :busy="busy" :can-handle="permissions.handle" :can-review="permissions.taskReview" @action="submit" />
   <van-empty v-else-if="!loading" description="任务不存在或当前无权访问" />
  </template>
 </MobileLoading>
</template>
