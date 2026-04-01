<script setup>
import { 
  LayoutDashboard, 
  User, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Wallet, 
  History, 
  CheckSquare, 
  Files, 
  Settings, 
  LogOut,
  X
} from 'lucide-vue-next';

import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);
const store = usePortalStore();
const router = useRouter();

const menuItems = [
  {
    category: 'MAIN MENU',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
    ]
  },
  {
    category: 'ACADEMICS',
    items: [
      { name: 'My Profile', icon: User, route: 'profile' },
      { name: 'My Grades', icon: GraduationCap, route: 'grades' },
      { name: 'Class Schedule', icon: Calendar, route: 'schedule' },
      { name: 'Prospectus', icon: FileText, route: 'prospectus' },
    ]
  },
  {
    category: 'FINANCE',
    items: [
      { name: 'Statement of Account', icon: Wallet, route: 'finance' },
      { name: 'Payment History', icon: History, route: 'finance' },
    ]
  },
  {
    category: 'SERVICES',
    items: [
      { name: 'E-Clearance', icon: CheckSquare, route: 'clearance' },
      { name: 'Request Documents', icon: Files, route: 'prospectus' },
    ]
  },
  {
    category: 'BOTTOM',
    items: [
      { name: 'Settings', icon: Settings, route: 'profile' },
      { name: 'Logout', icon: LogOut, color: 'text-red-500 hover:text-red-600', action: 'logout' },
    ]
  }
];

const handleAction = (item) => {
  if (item.action === 'logout') {
    store.signOut();
    router.push({ name: 'home' });
  }
};
</script>

<template>
  <!-- Sidebar Container -->
  <aside 
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <div class="h-full flex flex-col">
      <!-- Sidebar Header -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span class="text-white font-bold text-lg">C</span>
          </div>
          <span class="font-bold text-sm text-gray-800 leading-tight">CHCCI<br/>Student Portal</span>
        </div>
        <button @click="emit('close')" class="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div v-for="section in menuItems" :key="section.category" class="mb-8">
          <h3 v-if="section.category !== 'BOTTOM'" class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            {{ section.category }}
          </h3>
          <div class="space-y-1">
            <template v-for="item in section.items" :key="item.name">
              <router-link 
                v-if="!item.action"
                :to="{ name: item.route }"
                v-slot="{ isActive }"
                class="block"
              >
                <button 
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : item.color || 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  ]"
                >
                  <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                  <span>{{ item.name }}</span>
                </button>
              </router-link>
              <button 
                v-else
                @click="handleAction(item)"
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  item.color || 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span>{{ item.name }}</span>
              </button>
            </template>
          </div>
        </div>
      </nav>

      <!-- Footer Info (Optional) -->
      <div class="p-4 border-t border-gray-100 bg-gray-50/50">
        <p class="text-[10px] text-gray-400 text-center">Version 2.4.1 © 2026 CHCCI</p>
      </div>
    </div>
  </aside>

  <!-- Overlay for Mobile -->
  <div 
    v-if="isOpen" 
    @click="emit('close')" 
    class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
  ></div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
