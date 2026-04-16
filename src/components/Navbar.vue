<script setup>
import { 
  Search, 
  Bell, 
  Menu,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Palette,
  Moon,
  Leaf,
  Ghost,
  Zap
} from 'lucide-vue-next';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePortalStore } from '../stores/portalStore';
import { storeToRefs } from 'pinia';

const router = useRouter();

const emit = defineEmits(['toggle-sidebar']);

const store = usePortalStore();
const { user, notifications, unreadNotifications } = storeToRefs(store);

const isProfileOpen = ref(false);
const isNotifOpen = ref(false);
const isThemeOpen = ref(false);

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value;
  isNotifOpen.value = false;
  isThemeOpen.value = false;
};

const toggleNotifs = () => {
  isNotifOpen.value = !isNotifOpen.value;
  isProfileOpen.value = false;
  isThemeOpen.value = false;
};

const toggleTheme = () => {
  isThemeOpen.value = !isThemeOpen.value;
  isProfileOpen.value = false;
  isNotifOpen.value = false;
};

const changeTheme = (theme) => {
  store.setTheme(theme);
  isThemeOpen.value = false;
};

const themes = [
  { id: 'midnight', name: 'Midnight', icon: Moon, color: 'text-slate-900' },
  { id: 'nature', name: 'Nature', icon: Leaf, color: 'text-green-600' },
  { id: 'spooky', name: 'Spooky', icon: Ghost, color: 'text-orange-500' },
  { id: 'metropolis', name: 'Metropolis', icon: Zap, color: 'text-blue-500' }
];

const markRead = () => {
  store.markNotificationsRead();
};
</script>

<template>
  <nav class="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm glass">
    <!-- Desktop Search & Mobile Menu Button -->
    <div class="flex items-center gap-4 flex-1">
      <button 
        @click="emit('toggle-sidebar')" 
        class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu class="w-6 h-6" />
      </button>

      <div class="relative hidden sm:block max-w-md w-full ml-2">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <Search class="w-4 h-4" />
        </span>
        <input 
          type="text" 
          placeholder="Search for courses, grades, or events..." 
          :class="['w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all', store.isAdmin ? 'focus:ring-primary/20 focus:border-primary' : 'focus:ring-[#002147]/20 focus:border-[#002147]']"
        />
      </div>
    </div>

    <!-- Right Side: Notifications & Profile -->
    <div class="flex items-center gap-2 sm:gap-4 ml-4">
      <!-- Theme Switcher -->
      <div class="relative">
        <button 
          @click="toggleTheme"
          class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors group"
          title="Change Theme"
        >
          <Palette class="w-5 h-5 group-active:scale-95 transition-transform" />
        </button>

        <!-- Theme Dropdown -->
        <div 
          v-if="isThemeOpen" 
          class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div class="px-4 py-2 border-b border-gray-50">
            <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest">Select Theme</h4>
          </div>
          <div class="p-1">
            <button 
              v-for="t in themes" 
              :key="t.id"
              @click="changeTheme(t.id)"
              :class="['w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all', store.theme === t.id ? 'bg-gray-50 font-bold' : 'text-gray-600 hover:bg-gray-50']"
            >
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100', store.theme === t.id ? t.color : 'text-gray-400']">
                <component :is="t.icon" class="w-4 h-4" />
              </div>
              <span>{{ t.name }}</span>
              <div v-if="store.theme === t.id" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Vertical Divider -->
      <div class="w-px h-8 bg-gray-100 mx-1 hidden sm:block"></div>

      <!-- Notification Bell -->
      <div class="relative">
        <button 
          @click="toggleNotifs"
          class="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors group"
        >
          <Bell class="w-5 h-5 group-active:scale-95 transition-transform" />
          <span 
            v-if="unreadNotifications > 0" 
            class="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm shadow-red-200"
          ></span>
        </button>

        <!-- Notifications Dropdown -->
        <div 
          v-if="isNotifOpen" 
          class="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div class="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
            <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest">Notifications</h4>
            <button @click="markRead" :class="['text-[10px] font-bold hover:underline', store.isAdmin ? 'text-primary' : 'text-[#002147]']">Mark all as read</button>
          </div>
          <div class="max-h-64 overflow-y-auto">
            <div 
              v-for="n in notifications" 
              :key="n.id" 
              :class="['px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0', !n.read ? (store.isAdmin ? 'bg-primary/[0.02]' : 'bg-[#002147]/[0.02]') : '']"
            >
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', n.read ? 'bg-gray-100 text-gray-400' : (store.isAdmin ? 'bg-primary/10 text-primary' : 'bg-[#002147]/10 text-[#002147]')]">
                <CheckCircle v-if="n.read" class="w-4 h-4" />
                <AlertCircle v-else class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p :class="['text-xs leading-relaxed', !n.read ? 'font-bold text-gray-800' : 'text-gray-500']">{{ n.text }}</p>
                <div class="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                  <Clock class="w-3 h-3" />
                  {{ n.time }}
                </div>
              </div>
            </div>
            <div v-if="notifications.length === 0" class="p-8 text-center">
              <p class="text-xs text-gray-400 italic">No notifications yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Vertical Divider -->
      <div class="w-px h-8 bg-gray-100 mx-2 hidden sm:block"></div>

      <!-- User Profile Dropdown -->
      <div class="relative">
        <button 
          @click="toggleProfile"
          class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div class="flex flex-col text-right mr-2 hidden sm:flex">
            <span class="text-sm font-semibold text-gray-800">{{ user.name }}</span>
            <span class="text-[10px] font-medium text-gray-400">{{ store.isAdmin ? 'Admin' : 'Student' }} ID: {{ user.id }}</span>
          </div>
          <div :class="['w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border', store.isAdmin ? 'bg-primary/10 border-primary/20' : 'bg-[#002147]/10 border-[#002147]/20']">
            <img :src="user.avatar" alt="User" class="w-full h-full object-cover" />
          </div>
          <ChevronDown :class="['w-4 h-4 text-gray-400 transition-transform duration-200', isProfileOpen ? 'rotate-180' : '']" />
        </button>

        <!-- Profile Dropdown Menu -->
        <div 
          v-if="isProfileOpen" 
          class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <router-link to="/profile" @click="isProfileOpen = false" :class="['w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors', store.isAdmin ? 'hover:text-primary' : 'hover:text-[#002147]']">
            <UserIcon class="w-4 h-4" />
            <span>Profile Settings</span>
          </router-link>
          <button class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings class="w-4 h-4" />
            <span>Account Support</span>
          </button>
          <hr class="my-2 border-gray-50" />
          <button 
            @click="store.signOut(); router.push({ name: 'home' })"
            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut class="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Mobile Search Bar (Only shown on mobile) -->
  <div class="sm:hidden px-4 py-3 bg-white border-b border-gray-100">
    <div class="relative w-full">
      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
        <Search class="w-4 h-4" />
      </span>
      <input 
        type="text" 
        placeholder="Quick search..." 
        :class="['w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all', store.isAdmin ? 'focus:ring-primary/20' : 'focus:ring-[#002147]/20']"
      />
    </div>
  </div>
</template>
