import { inject, provide, type InjectionKey } from 'vue'
import { createI18n, useI18n as useGlobalI18n, type Composer } from 'vue-i18n'
import zh from '../locales/lang/zh.json'
import en from '../locales/lang/en.json'
import { mobileMessages } from './messages'
const key: InjectionKey<Composer> = Symbol('decoration-i18n')
export function provideDecorationI18n() {
  const i18n = createI18n({ legacy: false, locale: 'zh', fallbackLocale: 'en', messages: { zh: { ...zh, Mobile: mobileMessages }, en } })
  provide(key, i18n.global as unknown as Composer)
}
export function useI18n() { return inject(key, null) || useGlobalI18n() }
