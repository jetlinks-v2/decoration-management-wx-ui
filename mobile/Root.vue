<script setup lang="ts">
import { Button as VanButton } from 'vant'
import MobileNotice from './components/ui/MobileNotice.vue'
import MobileLoading from './components/ui/MobileLoading.vue'

import { reactive } from 'vue'
import { useI18n } from './i18n'
import App from './BusinessEntry.vue'
import LoginPage from './auth/LoginPage.vue'
import { authState } from './auth/session'
import { useMobileAuth } from './auth/useMobileAuth'
const { t, te } = useI18n()
const vm = reactive(useMobileAuth())
</script>
<template>
  <div v-if="!vm.ready" class="auth-loading"><MobileLoading :text="t('Mobile.loading')"><div style="height: 80px" /></MobileLoading></div>
  <section v-else-if="vm.configError" class="auth-error mobile-surface"><MobileNotice type="error" show-icon :message="te(vm.configError) ? t(vm.configError) : vm.configError" /><van-button block @click="vm.start">{{ t('Mobile.retry') }}</van-button></section>
  <App v-else-if="vm.hosted || authState.session && authState.authorization" :key="vm.appKey" :standalone="!vm.hosted" :logging-out="vm.loggingOut" @logout="vm.signOut" />
  <LoginPage v-else :notice="vm.notice" />
</template>
<style scoped>
.auth-loading, .auth-error { max-width: 420px; margin: 80px auto; padding: 24px; }
.auth-error .van-button { margin-top: 16px; }
</style>
