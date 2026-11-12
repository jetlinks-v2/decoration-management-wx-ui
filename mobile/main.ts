import {createApp} from 'vue'
import {createI18n} from 'vue-i18n'
import messages from '../locales/lang/zh.json'
import {mobileMessages} from './messages'
import {installStandaloneHost} from './standalone'
import Root from './Root.vue'
import 'vant/lib/index.css'
import '../components/decoration/decoration.css'
import './components/ui/mobile.css'
import './style.css'
installStandaloneHost()
createApp(Root).use(createI18n({legacy:false,locale:'zh',messages:{zh:{...messages,Mobile:mobileMessages}}})).mount('#app')
