<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Image as VanImage } from 'vant'
import MobileNotice from '../../mobile/components/ui/MobileNotice.vue'
import MobilePopup from '../../mobile/components/ui/MobilePopup.vue'

import { ref } from 'vue'
import FilePreview from './FilePreview.vue'
import { useFiles } from '../../hooks/decoration/useFiles'
import type { DecorationApi } from '../../services/decorationApi'
const props = withDefaults(defineProps<{ api: DecorationApi; value: string[]; projectId: string; decorationId?: string; purpose?: string; readonly?: boolean; multiple?: boolean; accept?: string; label?: string;downloadOnly?:boolean;downloadName?:string }>(),{multiple:true,accept:'.jpg,.jpeg,.png,.webp,.heic,.pdf,.doc,.docx,.xls,.xlsx,.gif,.bmp,.dwg,.dxf'})
const emit = defineEmits<{ 'update:value': [string[]] }>()
const input = ref<HTMLInputElement>()
const { uploading, error, previewId, thumbnails, upload, preview, download, remove } = useFiles(props, value => emit('update:value', value))
</script>
<template>
  <div class="decoration-files">
    <div v-for="(id, index) in value" :key="id" class="decoration-file">
      <van-button v-if="downloadOnly" plain @click="download(id,downloadName||(label==='下载'?undefined:label))">{{label||'下载模板'}}</van-button>
      <van-image v-else-if="thumbnails[id]" :src="thumbnails[id]" :width="120" :height="90" :alt="label || `附件 ${index + 1}`" style="object-fit:cover;border-radius:8px" />
      <span v-else>{{label || `附件 ${index + 1}`}}</span>
      <template v-if="!downloadOnly"><van-button plain @click="preview(id)">查看</van-button><van-button plain @click="download(id)">下载</van-button></template>
      <van-button v-if="!readonly" plain danger :disabled="uploading" @click="remove(id)">移除</van-button>
    </div>
    <div v-if="!readonly" class="decoration-file-upload">
      <input ref="input" hidden style="display:none" type="file" :multiple="multiple" :accept="accept" @change="upload($event)" />
      <van-button :loading="uploading" :disabled="!projectId || uploading" @click="input?.click()">上传文件</van-button>
      <small>单个文件最大20MB</small>
    </div>
    <MobileNotice v-if="error" type="error" :message="error" show-icon />
    <MobilePopup :show="!!previewId" title="查看附件" :width="1000" :footer="null" destroy-on-close @close="previewId=''">
      <FilePreview v-if="previewId" :key="previewId" :id="previewId" :api="api" />
    </MobilePopup>
  </div>
</template>

<style scoped>
.decoration-file-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.decoration-file-upload small{color:var(--ant-color-text-tertiary,#8c8c8c);font-size:12px}
.decoration-files{display:flex;flex-wrap:wrap;gap:12px}
.decoration-file{display:flex;align-items:center;min-width:0;gap:4px;flex-wrap:wrap}
.decoration-file-upload,.decoration-files>.mobile-notice{flex-basis:100%}
</style>
