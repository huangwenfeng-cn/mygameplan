<template>
  <Dropdown :options="dropdownItems">
    <template v-slot="{ open }">
      <button
        class="flex w-[14rem] items-center rounded-md px-2 py-2 text-left"
        :class="open ? 'bg-surface-selected shadow-sm' : 'hover:bg-surface-gray-3'"
      >
        <GameplanLogo class="w-8 h-8 rounded" />
        <div class="ml-2 flex flex-col">
          <div class="text-base font-medium text-ink-gray-8 leading-none">项目管理</div>
          <div class="mt-1 hidden text-sm text-ink-gray-6 sm:inline leading-none">
            {{ user.full_name }}
          </div>
        </div>
        <LucideChevronDown class="ml-auto hidden h-4 w-4 sm:inline text-ink-gray-7" />
      </button>
      <AboutDialog v-model="showAboutDialog" />
    </template>
  </Dropdown>
</template>
<script setup>
import { h, computed, ref, markRaw } from 'vue'
import { Dropdown } from 'frappe-ui'
import { showSettingsDialog } from '@/components/Settings'
import GameplanLogo from './GameplanLogo.vue'
import AboutDialog from './AboutDialog.vue'
import AppSelector from './AppSelector.vue'
import { useUser } from '@/data/users'
import { session } from '@/data/session'
import router from '@/router'
import { clear as clearIndexDb } from 'idb-keyval'
import { useTheme } from '@/utils/useTheme'

import LucideCreditCard from '~icons/lucide/credit-card'
import LucideMoon from '~icons/lucide/moon'
import LucideListRestart from '~icons/lucide/list-restart'
import LucideInfo from '~icons/lucide/info'
import LucideLayoutGrid from '~icons/lucide/layout-grid'

const user = useUser()
const showAboutDialog = ref(false)
const { setTheme } = useTheme()

const dropdownItems = computed(() => [
  {
    icon: 'user',
    label: '我的资料',
    onClick: () => {
      if (user.user_profile) {
        router.push({
          name: 'PersonProfile',
          params: { personId: user.user_profile },
        })
      } else {
        router.push({ name: 'People' })
      }
    },
  },
  {
    icon: LucideLayoutGrid,
    label: '应用',
    submenu: [
      {
        component: markRaw(AppSelector),
      },
    ],
  },
  {
    icon: 'settings',
    label: '设置与成员',
    onClick: () => showSettingsDialog(),
    condition: () => user.isNotGuest,
  },
  {
    icon: LucideMoon,
    label: '切换主题',
    submenu: [
      {
        label: '浅色模式',
        icon: 'sun',
        onClick: () => setTheme('light'),
      },
      {
        label: '深色模式',
        icon: 'moon',
        onClick: () => setTheme('dark'),
      },
      {
        label: '跟随系统',
        icon: 'monitor',
        onClick: () => setTheme('system'),
      },
    ],
  },
  {
    icon: LucideListRestart,
    label: '清除缓存',
    onClick: clearCache,
  },
  {
    icon: LucideInfo,
    label: '关于',
    onClick: () => {
      showAboutDialog.value = true
    },
  },
  {
    icon: () => h(LucideCreditCard),
    label: '订阅',
    condition: () => user.isNotGuest && window.frappecloud_host && window.site_name,
    onClick: () => {
      window.open(`${window.frappecloud_host}/dashboard/subscription/${window.site_name}`, '_blank')
    },
  },
  {
    icon: 'log-out',
    label: '退出登录',
    onClick: () => session.logout.submit(),
  },
])

function clearCache() {
  localStorage.clear()
  sessionStorage.clear()
  clearIndexDb().then(() => {
    console.log('Cache cleared')
    window.location.reload()
  })
}
</script>
