<script setup>
import { 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Wallet, 
  ArrowRight, 
  Megaphone, 
  Clock,
  User,
  BookOpen,
  LayoutDashboard
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const store = usePortalStore();
const { user, schedule } = storeToRefs(store);
const router = useRouter();
const settings = ref({ announcement: 'Welcome to the CHCCI Student Portal!' });

const isLoading = ref(true);

onMounted(async () => {
  isLoading.value = true;
  await store.fetchMySubjects();
  const res = await store.fetchSettings();
  if (res) settings.value = res;
  isLoading.value = false;
});

const navigateTo = (routeName) => {
  router.push({ name: routeName });
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
    <!-- Welcome Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          <SkeletonLoader :is-loading="isLoading" type="text" class="w-48 h-8 rounded-lg">
            Welcome back, <span class="text-primary italic">{{ user.name }}!</span>
          </SkeletonLoader>
        </h1>
        <p class="text-gray-500 mt-1 flex items-center gap-2">
          <BookOpen class="w-4 h-4 text-primary" />
          <SkeletonLoader :is-loading="isLoading" type="text" class="w-32 h-4 rounded-md">
            {{ user.program }} - {{ user.year }} (A.Y. 2026-2027)
          </SkeletonLoader>
        </p>
      </div>
      <div class="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <div class="text-right">
          <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Enrolled Status</p>
          <p class="text-sm font-semibold text-green-600">{{ user.enrolled ? 'FULLY ENROLLED' : 'PENDING' }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
    </header>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      
      <!-- Widget: Today's Schedule -->
      <section class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 text-white">
              <Clock class="w-5 h-5" />
            </div>
            <h2 class="text-lg font-bold text-gray-800 tracking-tight">Today's Class Schedule</h2>
          </div>
          <button @click="navigateTo('schedule')" class="text-sm font-medium text-primary hover:underline flex items-center gap-1 group">
            Full Schedule <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <template v-if="isLoading">
            <div v-for="i in 2" :key="i" class="bg-white p-5 rounded-3xl border border-gray-100 card-shadow h-44">
              <SkeletonLoader :is-loading="true" type="rect" />
            </div>
          </template>
          <article 
            v-else
            v-for="(classItem, index) in schedule" 
            :key="index"
            class="group bg-white p-5 rounded-3xl border border-gray-100 card-shadow hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
          >
            <!-- Decorative Accent -->
            <div class="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            
            <div class="flex items-start gap-4 mb-4">
              <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm', classItem.iconColor]">
                <Calendar class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-gray-800 group-hover:text-primary transition-colors">{{ classItem.name }}</h3>
                <p class="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                   <Clock class="w-3 h-3" /> {{ classItem.time }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <div class="flex items-center gap-2">
                <MapPin class="w-4 h-4 text-gray-400" />
                <span class="text-sm font-medium text-gray-600">{{ classItem.room }}</span>
              </div>
              <div class="flex items-center gap-2">
                <User class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-500">{{ classItem.instructor }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Snapshot Widgets Column -->
      <aside class="space-y-6">
        <h2 class="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-3">
          <div class="p-2 bg-accent rounded-xl text-white shadow-lg shadow-accent/20">
            <LayoutDashboard class="w-5 h-5" />
          </div>
          Snapshot
        </h2>
        
        <!-- Academic Standing Card -->
        <div class="bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-3xl border border-white card-shadow relative overflow-hidden group">
          <div class="flex flex-col gap-1 relative z-10">
            <p class="text-xs uppercase font-bold text-gray-500 tracking-widest">Academic Standing</p>
            <h3 class="text-3xl font-black text-gray-900 group-hover:scale-105 transition-transform origin-left">
              <SkeletonLoader :is-loading="isLoading" type="text" class="w-16 h-8 rounded-lg inline-block">
                {{ user.avg }}
              </SkeletonLoader>
            </h3>
            <p class="text-xs font-medium text-gray-400">Current GWA</p>
          </div>
          
          <button @click="navigateTo('grades')" class="mt-6 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-white/80 text-gray-800 border border-gray-100 hover:bg-white hover:shadow-md">
            View Grades
            <ArrowRight class="w-4 h-4" />
          </button>
          
          <GraduationCap class="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:rotate-12 transition-transform text-primary" />
        </div>

        <!-- Financial Status Card -->
        <div class="bg-gradient-to-br from-amber-200/20 to-amber-100/10 p-6 rounded-3xl border border-white card-shadow relative overflow-hidden group">
          <div class="flex flex-col gap-1 relative z-10">
            <p class="text-xs uppercase font-bold text-gray-500 tracking-widest">Financial Status</p>
            <h3 class="text-3xl font-black text-gray-900 group-hover:scale-105 transition-transform origin-left">
              <SkeletonLoader :is-loading="isLoading" type="text" class="w-24 h-8 rounded-lg inline-block">
                {{ store.formattedBalance }}
              </SkeletonLoader>
            </h3>
            <p class="text-xs font-medium text-gray-400">Account Balance</p>
          </div>
          
          <button @click="navigateTo('finance')" class="mt-6 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-primary text-white shadow-lg shadow-primary/30 hover:bg-red-800 active:scale-95">
            Pay Now
            <ArrowRight class="w-4 h-4" />
          </button>
          
          <Wallet class="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:rotate-12 transition-transform text-amber-600" />
        </div>
      </aside>
    </div>

    <!-- Wide Announcement Section -->
    <section class="relative bg-accent rounded-3xl p-6 sm:p-8 overflow-hidden card-shadow group">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div class="absolute top-0 right-0 w-64 h-64 border-8 border-white rounded-full -mr-20 -mt-20"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 border-4 border-white rounded-full -ml-16 -mb-16"></div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Megaphone class="w-8 h-8 text-white animate-bounce-slow" />
          </div>
          <div class="text-center sm:text-left">
            <h3 class="text-xl font-bold text-white mb-1">Campus Announcement</h3>
            <p class="text-white/80 text-sm max-w-md leading-relaxed">
              {{ settings.announcement }}
            </p>
          </div>
        </div>
        
        <button @click="navigateTo('clearance')" class="bg-secondary text-accent px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:bg-white transition-colors active:scale-95 flex items-center gap-2">
          Read Details 
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes bounce-slow {
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}
</style>
