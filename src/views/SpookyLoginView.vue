<script setup>
import { ref, computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Ghost as GhostIcon } from 'lucide-vue-next';

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
    // Small delay to show the happy ghost before redirect
    setTimeout(() => {
      if (store.isAdmin) {
        router.push({ name: 'admin' });
      } else {
        router.push({ name: 'dashboard' });
      }
    }, 1500);
  } else {
    error.value = result?.message || 'Invalid credentials. Please try again.';
    loginStatus.value = 'error';
  }
};

// SVG Animation Computed
const ghostEyeTranslate = computed(() => {
  if (loginStatus.value === 'success') return 'translate(0, 0) scale(1.1)';
  if (activeField.value === 'id') return 'translate(4px, 2px)';
  if (activeField.value === 'password') return 'translate(0, -2px)';
  return 'translate(0, 0)';
});

const isShy = computed(() => activeField.value === 'password' && loginStatus.value !== 'success');

const mouthPath = computed(() => {
  if (loginStatus.value === 'success') return 'M60,110 Q75,135 90,110'; // Happy Smile
  if (loginStatus.value === 'error') return 'M60,120 Q75,100 90,120'; // Sad Frown
  return 'M60,115 Q75,105 90,115'; // Neutral
});
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-[#0a0f16] p-6 relative overflow-hidden font-inter">
    
    <!-- Atmospheric Background -->
    <div class="absolute inset-0 z-0 text-white">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-[#002147]/40 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 w-full max-w-5xl animate-in fade-in duration-1000">
      
      <!-- Logo Integration -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-12 h-12 rounded-2xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/40 border border-white/10">
           <span class="text-white font-black text-2xl italic">C</span>
        </div>
        <div class="text-left">
          <span class="block font-black text-2xl leading-none tracking-tight text-white">CHCCI</span>
          <span class="text-[10px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase">Student Portal Hub</span>
        </div>
      </div>

      <!-- Spooky Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2 max-w-3xl mx-auto leading-tight">
          Welcome to <span class="text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">CHCC Student Portal</span>
        </h1>
        <p class="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Gateway • Higher Education</p>
      </div>

      <!-- Card Container -->
      <div class="bg-[#121a24] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch min-h-[550px]">
        
        <!-- Left Side: Interactive Ghosts -->
        <div class="w-full md:w-1/2 bg-[#16202c]/50 p-12 flex items-center justify-center relative group">
          
          <!-- Floating Shadows -->
          <div class="absolute bottom-12 left-1/4 right-1/4 h-4 bg-black/40 rounded-full blur-xl scale-75 animate-bounce-slow"></div>

          <svg viewBox="0 0 400 300" class="w-full h-full drop-shadow-2xl">
            <!-- Small Ghost (Sad/Crying) -->
            <g class="ghost-float" style="animation-delay: -1s">
              <path d="M50,150 Q50,80 100,80 Q150,80 150,150 L150,220 Q150,230 140,230 Q130,230 120,220 Q110,210 100,220 Q90,230 80,220 Q70,210 60,220 Q50,230 40,220 L40,150 Z" fill="white" />
              <!-- Eyes -->
              <circle cx="80" cy="140" r="4" fill="#0a0f16" />
              <circle cx="120" cy="140" r="4" fill="#0a0f16" />
              <!-- Mouth -->
              <path d="M90,165 Q100,160 110,165" fill="none" stroke="#0a0f16" stroke-width="2" stroke-linecap="round" />
              <!-- Tears -->
              <circle v-if="loginStatus !== 'success'" class="tear-drop" cx="80" cy="150" r="3" fill="#3b82f6" />
              <circle v-if="loginStatus !== 'success'" class="tear-drop" cx="120" cy="150" r="3" fill="#3b82f6" style="animation-delay: 1.5s" />
            </g>

            <!-- Big Ghost (Interactive) -->
            <g class="ghost-float" transform="translate(180, 50)">
              <path d="M0,100 Q0,0 75,0 Q150,0 150,100 L150,180 Q150,195 135,195 Q120,195 105,180 Q90,165 75,180 Q60,195 45,180 Q30,165 15,180 Q0,195 -15,180 L-15,100 Z" fill="white" />
              
              <!-- Eyes Container -->
              <g class="eye-transition" :style="{ transform: ghostEyeTranslate }">
                <circle cx="45" cy="80" r="8" fill="#0a0f16" />
                <circle cx="105" cy="80" r="8" fill="#0a0f16" />
                <!-- Pupils for extra detail -->
                <circle cx="47" cy="78" r="2" fill="white" opacity="0.5" />
                <circle cx="107" cy="78" r="2" fill="white" opacity="0.5" />
              </g>

              <!-- Mouth -->
              <path :d="mouthPath" fill="none" :stroke="loginStatus === 'success' ? '#0ea5e9' : '#0a0f16'" stroke-width="3" stroke-linecap="round" class="eye-transition" />

              <!-- Crying detail for big ghost too -->
              <circle v-if="loginStatus === 'error'" class="tear-drop" cx="45" cy="95" r="4" fill="#3b82f6" style="animation-delay: 0.5s" />
              <circle v-if="loginStatus === 'error'" class="tear-drop" cx="105" cy="95" r="4" fill="#3b82f6" style="animation-delay: 2.2s" />

              <!-- Interactive Hands (Shy Mode) -->
              <g class="hand-transition" :style="{ transform: isShy ? 'translate(0, -60px)' : 'translate(0, 0)', opacity: isShy ? 1 : 0 }">
                <circle cx="35" cy="140" r="15" fill="white" />
                <circle cx="115" cy="140" r="15" fill="white" />
              </g>
            </g>
          </svg>
        </div>

        <!-- Right Side: Login Form -->
        <div class="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div class="max-w-sm mx-auto w-full space-y-8">
            
            <div class="text-center md:text-left">
              <h2 class="text-3xl font-black text-white leading-tight">Sign In</h2>
              <p class="text-gray-500 mt-2 font-medium">Access your secure portal credentials.</p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-6">
              <!-- Error Alert -->
              <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                <ShieldCheck class="w-4 h-4 shrink-0" />
                {{ error }}
              </div>

              <!-- Student ID -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student ID Number</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 group-focus-within:text-[#a3e635] transition-colors">
                    <User class="w-5 h-5" />
                  </span>
                  <input 
                    v-model="studentId"
                    @focus="activeField = 'id'"
                    @blur="activeField = ''"
                    type="text" 
                    placeholder="e.g., 2021-0042" 
                    class="w-full bg-[#1e293b]/50 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#a3e635] transition-all font-bold text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              <!-- Password -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Password</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 group-focus-within:text-[#a3e635] transition-colors">
                    <Lock class="w-5 h-5" />
                  </span>
                  <input 
                    v-model="password"
                    @focus="activeField = 'password'"
                    @blur="activeField = ''"
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="Enter your password" 
                    class="w-full bg-[#1e293b]/50 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#a3e635] transition-all font-bold text-white placeholder:text-gray-600 font-mono"
                  />
                  <button 
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#a3e635] transition-colors"
                  >
                    <EyeOff v-if="showPassword" class="w-5 h-5" />
                    <Eye v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Action Button -->
              <button 
                type="submit" 
                :disabled="store.authLoading"
                class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <template v-if="!store.authLoading">
                  Sign In
                  <ArrowRight class="w-5 h-5" />
                </template>
                <template v-else>
                  <Loader2 class="w-5 h-5 animate-spin" />
                  Authenticating...
                </template>
              </button>
            </form>

            <!-- Bottom Link -->
            <p class="text-center text-sm font-bold text-gray-500 pt-4">
              New Student? 
              <router-link to="/register" class="text-white hover:text-[#a3e635] underline underline-offset-4 transition-colors">Enroll/Register Now</router-link>
            </p>

          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 flex flex-wrap items-center justify-between gap-4 px-4">
        <div class="flex items-center gap-2 text-gray-600 text-[10px] font-black uppercase tracking-widest">
          <GhostIcon class="w-4 h-4" />
          CHCCI Secure Gateway v2.0
        </div>
        <div class="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-600">
          <a href="#" class="hover:text-white transition-colors">Privacy</a>
          <a href="#" class="hover:text-white transition-colors">Support</a>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.ghost-float { animation: float 6s ease-in-out infinite; }
.tear-drop { animation: tear 3s ease-in infinite; }
.eye-transition { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.hand-transition { transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
@keyframes tear {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(40px) scale(0.5); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.animate-bounce-slow {
  animation: bounce-slow 4s ease-in-out infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: scaleX(0.7) opacity(0.3); }
  50% { transform: scaleX(1.1) opacity(0.1); }
}
</style>
