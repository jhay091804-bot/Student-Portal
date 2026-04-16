<script setup>
import { ShieldAlert, LogOut, Clock, MessageSquare } from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';

const store = usePortalStore();
const router = useRouter();

const handleSignOut = () => {
  store.signOut();
  router.push({ name: 'home' });
};
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white overflow-hidden relative">
    <!-- Animated Gradients -->
    <div class="absolute top-0 -left-64 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-20 animate-pulse"></div>
    <div class="absolute bottom-0 -right-64 w-[500px] h-[500px] bg-red-800 rounded-full blur-[150px] opacity-20 animate-pulse delay-700"></div>

    <div class="max-w-2xl w-full text-center space-y-12 relative z-10 transition-all">
      <!-- Icon Shield -->
      <div class="relative inline-block">
        <div class="w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] flex items-center justify-center shadow-2xl animate-bounce duration-1000">
           <ShieldAlert class="w-16 h-16 text-primary" />
        </div>
        <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg animate-spin duration-3000">
          <Clock class="w-5 h-5 text-white" />
        </div>
      </div>

      <div class="space-y-6">
        <h1 class="text-5xl sm:text-7xl font-black tracking-tighter italic">
          SYSTEM <span class="text-primary tracking-normal not-italic">LOCKDOWN</span>
        </h1>
        <p class="text-xl text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
          The CHCCI Portal is currently undergoing scheduled administrative maintenance to enhance your experience.
        </p>
      </div>

      <!-- Announcement Card -->
      <div class="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] shadow-inner text-left space-y-4">
        <div class="flex items-center gap-3">
          <MessageSquare class="w-5 h-5 text-primary" />
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Official Announcement</span>
        </div>
        <p class="text-lg font-bold text-white italic leading-snug">
          "{{ store.settings.announcement || 'System upgrades are in progress. Expected uptime in 2 hours.' }}"
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          @click="handleSignOut"
          class="bg-white text-slate-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:bg-primary hover:text-white transition-all group lg:w-fit"
        >
          <LogOut class="w-4 h-4" /> Sign Out from Session
        </button>
      </div>

      <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
        © 2026 CONCEPCION HOLY CROSS COLLEGE INC. • IT DEPARTMENT
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes duration-3000 {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: duration-3000 linear infinite;
}
</style>
