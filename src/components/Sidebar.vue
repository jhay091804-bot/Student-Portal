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
  X,
  Users,
  MessageSquare
} from 'lucide-vue-next';

import { usePortalStore } from '../stores/portalStore';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);
const store = usePortalStore();
const router = useRouter();
const route = useRoute();

const menuItems = computed(() => {
  const commonItems = [
    { name: 'Student Wall', icon: Users, route: 'wall' },
    { 
      name: 'Direct Messages', 
      icon: MessageSquare, 
      route: store.isAdmin ? 'admin' : 'messages',
      query: store.isAdmin ? { view: 'messages' } : null 
    },
    { name: 'Campus Calendar', icon: Calendar, route: 'calendar' },
    { name: 'Organizations', icon: Users, route: 'organizations' },
  ];

  const common = [
    {
      category: 'COMMUNITY',
      items: commonItems
    }
  ];

  if (store.isAdmin) {
    return [
      {
        category: 'ADMINISTRATION',
        items: [
          { name: 'Dashboard', icon: LayoutDashboard, route: 'admin', query: { view: 'dashboard' } },
          { name: 'Student Records', icon: Users, route: 'admin', query: { view: 'students' } },
        ]
      },
      ...common,
      {
        category: 'SYSTEM',
        items: [
          { name: 'Analytics', icon: GraduationCap, route: 'admin', query: { view: 'analytics' } },
          { name: 'Security Settings', icon: Settings, route: 'admin', query: { view: 'settings' } },
        ]
      }
    ];
  }

  return [
    {
      category: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
      ]
    },
    ...common,
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
    }
  ];
});

const bottomItems = [
  { name: 'Settings', icon: Settings, route: 'profile' },
  { name: 'Logout', icon: LogOut, color: 'text-red-500 hover:text-red-600', action: 'logout' },
];

const handleAction = (item) => {
  if (item.action === 'logout') {
    store.signOut();
  }
};

const isLinkActive = (item) => {
  // Check if route name matches
  if (route.name !== item.route) return false;
  
  // If there's a view query param requirement, check it
  if (item.query && item.query.view) {
    return route.query.view === item.query.view;
  }
  
  // For items without query params, they are active if the route matches and there's no view param in current route
  // Or if they are student wall, calendar, etc which don't use the 'view' based admin routing
  if (item.route !== 'admin') return true;
  
  // Special case for dashboard when no view is specified
  if (item.query && item.query.view === 'dashboard' && !route.query.view) return true;
  
  return false;
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
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', store.isAdmin ? 'bg-primary' : 'bg-[#002147]']">
            <span class="text-white font-bold text-lg">C</span>
          </div>
          <span class="font-bold text-sm text-gray-800 leading-tight">CHCCI<br/>{{ store.isAdmin ? 'Admin' : 'Student' }} Portal</span>
        </div>
        <button @click="emit('close')" class="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div v-for="section in menuItems" :key="section.category" class="mb-8">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            {{ section.category }}
          </h3>
          <div class="space-y-1">
            <template v-for="item in section.items" :key="item.name">
              <router-link 
                v-if="!item.action"
                :to="{ name: item.route, query: item.query }"
                class="block"
              >
                <button 
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isLinkActive(item)
                      ? (store.isAdmin ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#002147] text-white shadow-lg shadow-[#002147]/20') 
                      : item.color || (store.isAdmin ? 'text-gray-600 hover:bg-gray-50 hover:text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002147]')
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
                  item.color || (store.isAdmin ? 'text-gray-600 hover:bg-gray-50 hover:text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002147]')
                ]"
              >
                <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span>{{ item.name }}</span>
              </button>
            </template>
          </div>
        </div>

        <div class="mt-8 border-t border-gray-100 pt-8 mb-8">
          <div class="space-y-1">
            <template v-for="item in bottomItems" :key="item.name">
              <router-link 
                v-if="!item.action"
                :to="{ name: item.route, query: item.query }"
                class="block"
              >
                <button 
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isLinkActive(item)
                      ? (store.isAdmin ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#002147] text-white shadow-lg shadow-[#002147]/20') 
                      : item.color || (store.isAdmin ? 'text-gray-600 hover:bg-gray-50 hover:text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002147]')
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
                  item.color || (store.isAdmin ? 'text-gray-600 hover:bg-gray-50 hover:text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002147]')
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
