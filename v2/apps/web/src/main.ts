import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

// vxe-table 组件注册
import {
  VxeTable,
  VxeColumn,
  VxeColgroup,
  VxeGrid,
  VxeToolbar,
} from 'vxe-table'
import {
  VxeButton,
  VxeButtonGroup,
  VxeCheckbox,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxePager,
  VxeSelect,
  VxeTooltip,
  VxeUpload,
} from 'vxe-pc-ui'
import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/styles/cssvar.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

// 注册 vxe-table 核心组件
app.use(VxeTable)
app.use(VxeColumn)
app.use(VxeColgroup)
app.use(VxeGrid)
app.use(VxeToolbar)

// 注册 vxe-pc-ui 组件
app.use(VxeButton)
app.use(VxeButtonGroup)
app.use(VxeCheckbox)
app.use(VxeIcon)
app.use(VxeInput)
app.use(VxeLoading)
app.use(VxeModal)
app.use(VxePager)
app.use(VxeSelect)
app.use(VxeTooltip)
app.use(VxeUpload)

app.mount('#app')