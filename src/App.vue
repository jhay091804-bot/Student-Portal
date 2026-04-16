<script setup>
import { ref, onMounted } from 'vue';
import { usePortalStore } from './stores/portalStore';
import { storeToRefs } from 'pinia';
import Sidebar from './components/Sidebar.vue';
import Navbar from './components/Navbar.vue';
import CORPrintout from './components/CORPrintout.vue';

const store = usePortalStore();
const { isAuthenticated } = storeToRefs(store);

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

// Handle window resize for sidebar behavior
onMounted(() => {
  // Initialize theme from store
  document.body.className = `theme-${store.theme}`;
  
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      isSidebarOpen.value = false;
    }
  });
});
</script>

<template>
  <div :class="['flex min-h-screen font-sans text-gray-900', `theme-${store.theme}`, !isAuthenticated ? 'w-full' : '', store.isAdmin ? 'selection:bg-primary/20 selection:text-primary' : 'selection:bg-accent/20 selection:text-accent']" :style="{ backgroundColor: 'var(--bg-main)' }">
    
    <!-- Sidebar (Only if Authenticated) -->
    <Sidebar v-if="isAuthenticated" :is-open="isSidebarOpen" @close="closeSidebar" />

    <!-- Main Content Area -->
    <div :class="['flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative', !isAuthenticated ? 'w-full' : '']">
      
      <!-- Navbar (Only if Authenticated) -->
      <Navbar v-if="isAuthenticated" @toggle-sidebar="toggleSidebar" />

      <!-- Scrollable Content -->
      <main :class="['flex-1 overflow-y-auto custom-scrollbar relative', isAuthenticated ? 'bg-gray-50/30' : 'bg-white']">
        
        <!-- Transition for Page Navigation -->
        <router-view v-slot="{ Component }">
          <transition 
            name="page-fade" 
            mode="out-in"
          >
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
        
        <!-- Footer (Responsive Visibility) -->
        <footer class="mt-auto px-4 sm:px-8 py-6 border-t border-gray-100 bg-white/50 text-center">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium tracking-wide leading-relaxed">
            © 2026 CONCEPCION HOLY CROSS COLLEGE INC. (CHCCI) <span class="block sm:inline">{{ store.isAdmin ? 'ADMIN' : 'STUDENT' }} PORTAL v2.5.0</span>
          </p>
        </footer>
      </main>

    </div>
    
    <!-- Print Optimized Components -->
    <CORPrintout v-if="isAuthenticated" />
  </div>
</template>

<style>
/* Global Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Page Transitions */
.page-fade-enter-active, 
.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hide spin buttons in number inputs */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
