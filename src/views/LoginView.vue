<script setup>
import { ref } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-vue-next';

const store = usePortalStore();
const router = useRouter();

const studentId = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!studentId.value || !password.value) {
    error.value = 'Please enter both Student ID and Password.';
    return;
  }
  
  error.value = '';
  const result = await store.signIn(studentId.value, password.value);
  
  if (result === true || result?.success) {
    if (store.isAdmin) {
      router.push({ name: 'admin' });
    } else {
      router.push({ name: 'dashboard' });
    }
  } else {
    error.value = result?.message || 'Invalid credentials. Please try again.';
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex bg-[#f8fafc] overflow-hidden">
    
    <!-- Left Side: Branding & Info (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12 overflow-hidden">
      <!-- Decorative Background elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>
      
      <div class="relative z-10 text-center max-w-sm">
        <div class="w-24 h-24 bg-white rounded-3xl mx-auto mb-8 shadow-2xl flex items-center justify-center animate-in zoom-in-50 duration-700">
           <span class="text-primary text-5xl font-black italic">C</span>
        </div>
        <h1 class="text-4xl font-black text-white tracking-tight mb-4">CHCCI Student Portal</h1>
        <p class="text-white/70 leading-relaxed font-medium">
          "Concepcion Holy Cross College Inc. (CHCCI) — Nurturing minds, building futures, and empowering the youth through quality education."
        </p>
        
        <!-- Quick Stats/Info -->
        <div class="mt-12 grid grid-cols-2 gap-4">
          <div class="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-white">
            <p class="text-2xl font-bold">1985</p>
            <p class="text-[10px] uppercase font-bold text-white/50 tracking-widest">Established</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-white">
            <p class="text-2xl font-bold">A+</p>
            <p class="text-[10px] uppercase font-bold text-white/50 tracking-widest">Accreditied</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 animate-in slide-in-from-right-10 duration-500">
      <div class="w-full max-w-md space-y-8">
        
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black italic shadow-lg">C</div>
          <h2 class="text-2xl font-black text-gray-900 leading-tight">CHCCI Student Portal</h2>
        </div>

        <div class="text-center lg:text-left">
          <h2 class="text-3xl font-black text-gray-900 leading-tight">Welcome Back</h2>
          <p class="text-gray-500 mt-2 font-medium">Please enter your credentials to access your academic records.</p>
          <div class="mt-4 bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center gap-3">
             <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
             <p class="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Registered recently? Use the ID from your success screen.</p>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in shake">
            <ShieldCheck class="w-4 h-4 shrink-0" />
            {{ error }}
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Student ID Number</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                <User class="w-5 h-5" />
              </span>
              <input 
                v-model="studentId"
                type="text" 
                placeholder="e.g., 2021-0042" 
                class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Password</label>
              <a href="#" class="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Forgot Password?</a>
            </div>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock class="w-5 h-5" />
              </span>
              <input 
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                @copy.prevent 
                @paste.prevent 
                @contextmenu.prevent
                placeholder="Enter your password" 
                class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-primary transition-all font-bold text-gray-700"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3 px-1">
            <input type="checkbox" id="remember" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
            <label for="remember" class="text-sm font-semibold text-gray-600 cursor-pointer">Remember my device</label>
          </div>

          <button 
            type="submit" 
            :disabled="store.authLoading"
            class="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <template v-if="!store.authLoading">
              Access Portal
              <ArrowRight class="w-5 h-5" />
            </template>
            <template v-else>
              <Loader2 class="w-5 h-5 animate-spin" />
              Authenticating...
            </template>
          </button>
        </form>

        <p class="text-center text-sm font-semibold text-gray-500 pt-4">
          New Student? 
          <router-link to="/register" class="text-primary hover:underline">Enroll/Register Now</router-link>
        </p>

        <!-- Academic Support Footer -->
        <div class="pt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase text-center">
          <a href="#" class="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-primary transition-colors">Contact Registrar</a>
          <a href="#" class="hover:text-primary transition-colors">Help Center</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
