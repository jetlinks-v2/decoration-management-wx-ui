<script setup lang="ts">
import { Button as VanButton } from 'vant'
import { Space as VanSpace } from 'vant'
import MobileNotice from '../../mobile/components/ui/MobileNotice.vue'

import { ref } from 'vue'
import { useSignature } from '../../hooks/decoration/useSignature'
import type { DecorationApi } from '../../services/decorationApi'
const props = defineProps<{api: DecorationApi; projectId: string; decorationId?: string;disabled?:boolean}>()
const emit = defineEmits<{saved: [string]}>()
const canvas = ref<HTMLCanvasElement>()
const {start, move, end, clear, save, saving, error, signed} = useSignature(canvas, props, id => emit('saved',id))
</script>
<template>
  <div class="signature-pad">
    <canvas ref="canvas" width="640" height="240" aria-label="请在此签名" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" />
    <van-space><van-button :disabled="saving||disabled" @click="clear">清除</van-button><van-button :loading="saving" :disabled="!signed||disabled" @click="save">确认签名</van-button></van-space>
    <MobileNotice v-if="error" type="error" v-model:message="error" />
  </div>
</template>
<style scoped>
canvas{width:100%;height:120px;border:1px solid #d9d9d9;border-radius:6px;touch-action:none;background:#fff}.signature-pad{display:grid;gap:8px}
</style>
