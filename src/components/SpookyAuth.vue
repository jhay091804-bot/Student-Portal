<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-vue-next';
import SkeletonLoader from './SkeletonLoader.vue';

const emit = defineEmits(['status-change']);

const props = defineProps({
  onSuccess: { type: Function, default: () => {} }
});

const store = usePortalStore();
const router = useRouter();

const studentId = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');

// Animation & Expression State
const activeField = ref(''); // 'id', 'password', or ''
const loginStatus = ref('idle'); // 'idle', 'success', 'error'

const handleLogin = async () => {
  if (!studentId.value || !password.value) {
    error.value = 'Please enter both Student ID and Password.';
    loginStatus.value = 'error';
    return;
  }
  
  error.value = '';
  loginStatus.value = 'idle';
  const result = await store.signIn(studentId.value, password.value);
  
  if (result === true || result?.success) {
    loginStatus.value = 'success';
    emit('status-change', 'success');
    // Small delay to show the happy ghost
    setTimeout(() => {
      props.onSuccess();
      if (store.isAdmin) {
        router.push({ name: 'admin' });
      } else {
        router.push({ name: 'dashboard' });
      }
    }, 1500);
  } else {
    error.value = result?.message || 'Invalid credentials.';
    loginStatus.value = 'error';
    emit('status-change', 'error');
  }
};

const isAuthenticating = computed(() => store.authLoading);

// SVG Animation Computed
const ghostEyeTranslate = computed(() => {
  if (loginStatus.value === 'success') return 'translate(0, 0) scale(1.1)';
  if (activeField.value === 'id') return 'translate(10px, 5px)'; // Boosted movement
  if (activeField.value === 'password') return 'translate(0, -5px)'; // Boosted "hide"
  return 'translate(0, 0)';
});

const isShy = computed(() => activeField.value === 'password' && loginStatus.value !== 'success');

const mouthPath = computed(() => {
  if (loginStatus.value === 'error') return 'M60,120 Q75,100 90,120'; // Sad Frown
  return 'M60,110 Q75,135 90,110'; // Happy Smile by default
});

const ghostBaseTranslate = computed(() => {
  if (activeField.value === 'password' && showPassword.value) {
    return 'translate(160px, 45px) rotate(5deg)'; // Peeking a little when password is visible
  }
  return 'translate(150px, 50px) rotate(0deg)'; // Always Centered
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    
    <!-- Ghost Interaction Area (Glass Style) -->
    <div ref="ghostRef" class="h-40 flex items-center justify-center relative bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden mb-4 shadow-inner border border-white/10">
       <SkeletonLoader :is-loading="isAuthenticating" type="rect" class="absolute inset-0 z-20" />
       <svg viewBox="0 0 450 300" class="w-full h-full drop-shadow-2xl scale-90">
          <!-- The Only Ghost (Interactive Peek-a-Boo) -->
          <g class="ghost-float-fast" :style="{ transform: ghostBaseTranslate }">
            <path d="M0,100 Q0,0 75,0 Q150,0 150,100 L150,180 Q150,195 135,195 Q120,195 105,180 Q90,165 75,180 Q60,195 45,180 Q30,165 15,180 Q0,195 0,180 L0,100 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
            
            <!-- Eyes Wrapper (Closing eyes when typing password) -->
            <g class="eye-transition" :style="{ transform: ghostEyeTranslate }">
              <template v-if="activeField !== 'password' || showPassword">
                <!-- Pupils following cursor -->
                <g :style="{ transform: pupilShift }">
                   <circle cx="45" cy="80" r="8" fill="#001A4D" />
                   <circle cx="105" cy="80" r="8" fill="#001A4D" />
                </g>
              </template>
              <template v-else>
                <path d="M35,80 Q45,90 55,80" fill="none" stroke="#001A4D" stroke-width="4" stroke-linecap="round" />
                <path d="M95,80 Q105,90 115,80" fill="none" stroke="#001A4D" stroke-width="4" stroke-linecap="round" />
              </template>
            </g>

            <path :d="mouthPath" fill="none" :stroke="loginStatus === 'success' ? '#0ea5e9' : '#001A4D'" stroke-width="3" stroke-linecap="round" class="eye-transition" />
            
            <circle v-if="loginStatus === 'error'" class="tear-drop" cx="45" cy="95" r="4" fill="#3b82f6" style="animation-delay: 0.5s" />
            <circle v-if="loginStatus === 'error'" class="tear-drop" cx="105" cy="95" r="4" fill="#3b82f6" style="animation-delay: 2.2s" />
          </g>
       </svg>
    </div>

    <!-- Sign In Form -->
    <div class="space-y-4">
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase text-center animate-shake border border-red-100">{{ error }}</div>
      
      <div class="space-y-2 text-left">
        <label class="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Student ID</label>
        <div class="relative group">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-white/40 group-focus-within:text-[#D4AF37] transition-colors"><User :size="18" /></span>
          <input 
            v-model="studentId" 
            @focus="activeField = 'id'"
            @blur="activeField = ''"
            type="text" 
            placeholder="e.g., 51762023" 
            class="w-full bg-white/10 backdrop-blur-md border-2 border-white/5 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#D4AF37] font-black text-sm text-white placeholder:text-white/30 transition-all select-none" 
          />
        </div>
      </div>

      <div class="space-y-2 text-left">
        <label class="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Password</label>
        <div class="relative group">
          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-white/40 group-focus-within:text-[#D4AF37] transition-colors"><Lock :size="18" /></span>
          <input 
            v-model="password" 
            @focus="activeField = 'password'"
            @blur="activeField = ''"
            :type="showPassword ? 'text' : 'password'" 
            placeholder="••••••••" 
            class="w-full bg-white/10 backdrop-blur-md border-2 border-white/5 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:border-[#D4AF37] font-black text-sm text-white placeholder:text-white/30 transition-all font-mono select-none" 
          />
          <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-[#D4AF37] transition-colors">
            <Eye v-if="!showPassword" :size="18" />
            <EyeOff v-else :size="18" />
          </button>
        </div>
      </div>

      <button 
        @click="handleLogin" 
        :disabled="store.authLoading || loginStatus === 'success'" 
        class="w-full bg-[#001A4D] hover:bg-[#003366] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-white/30"
      >
        <template v-if="!store.authLoading && loginStatus !== 'success'">
          Sign In <ArrowRight :size="16"/>
        </template>
        <template v-else-if="loginStatus === 'success'">
          Welcome Back!
        </template>
        <template v-else>
           <SkeletonLoader :is-loading="true" type="rect" class="w-24 h-4 rounded-full" />
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ghost-float-fast { transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.ghost-float { animation: float 6s ease-in-out infinite; }
.tear-drop { animation: tear 3s ease-in infinite; }
.eye-transition { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.hand-transition { transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.hand-transition-fast { transition: cx 0.2s ease-in-out; }

.animate-wobble-funny { animation: animate-wobble-funny 0.5s infinite linear; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes animate-wobble-funny {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes tear {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(25px) scale(0.5); }
}

@keyframes animate-shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
.animate-shake { animation: animate-shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
</style>
