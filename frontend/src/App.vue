<template>
  <FrappeUIProvider>
    <ScrollAreaRoot class="h-full overflow-hidden">
      <router-view v-if="['Onboarding', 'Login'].includes($route.name)" />
      <Layout class="hello" v-else-if="$session.isLoggedIn">
        <router-view />
      </Layout>
    </ScrollAreaRoot>
    <NewTaskDialog />
    <Dialogs />
  </FrappeUIProvider>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted } from 'vue'
import { FrappeUIProvider } from 'frappe-ui'
import { ScrollAreaRoot } from 'reka-ui'
import { Dialogs } from '@/utils/dialogs'
import { users } from '@/data/users'
import { useScreenSize } from '@/composables/useScreenSize'
import NewTaskDialog from './components/NewTaskDialog/NewTaskDialog.vue'
import { startTextEditorDynamicLocalization } from '@/utils/textEditorDynamicLocalization'

const screenSize = useScreenSize()
const MobileLayout = defineAsyncComponent(() => import('./components/MobileLayout.vue'))
const DesktopLayout = defineAsyncComponent(() => import('./components/DesktopLayout.vue'))
const Layout = computed(() => {
  if (screenSize.width < 640) {
    return MobileLayout
  } else {
    return DesktopLayout
  }
})

users.fetch()

let stopDynamicLocalization: (() => void) | null = null

onMounted(() => {
  stopDynamicLocalization = startTextEditorDynamicLocalization()
})

onBeforeUnmount(() => {
  stopDynamicLocalization?.()
  stopDynamicLocalization = null
})
</script>
