<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  GraduationCap
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const status = ref('verifying'); // verifying, success, error
const message = ref('');
const studentId = ref('');

onMounted(async () => {
  const token = route.params.token;
  if (!token) {
    status.value = 'error';
    message.value = 'Invalid verification link. Please check your email and try again.';
    return;
  }

  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
    const response = await axios.get(`${apiBase}/auth/verify/${token}`);
    status.value = 'success';
    message.value = response.data.message || 'Your email has been verified successfully!';
    studentId.value = response.data.studentId || '';
  } catch (error) {
    status.value = 'error';
    message.value = error.response?.data?.error || 'Verification failed. The link may have expired.';
  }
});

const goToLogin = () => {
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-primary/20">
    <div class="w-full max-w-lg">
      
      <!-- Logo Header -->
      <div class="flex items-center justify-center gap-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div class="w-12 h-12 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg">
          <GraduationCap class="w-7 h-7 text-white" />
        </div>
        <div>
          <span class="block font-black text-xl tracking-tight text-[#002147]">CHCCI</span>
          <span class="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Student Portal</span>
        </div>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 p-12 text-center relative overflow-hidden">
        
        <!-- Verifying State -->
        <div v-if="status === 'verifying'" class="space-y-8 animate-in fade-in zoom-in-95">
          <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 bg-primary/10 rounded-full animate-ping duration-1500"></div>
            <div class="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl">
              <Loader2 class="w-12 h-12 animate-spin" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-3xl font-black text-[#002147] tracking-tight">Verifying Profile</h2>
            <p class="text-slate-500 font-medium leading-relaxed">
              Please wait while we secure your academic credentials and finalize your enrollment link...
            </p>
          </div>
          <div class="pt-4 flex justify-center gap-1">
             <span class="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
             <span class="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></span>
             <span class="w-2 h-2 rounded-full bg-primary animate-bounce delay-200"></span>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="status === 'success'" class="space-y-8 animate-in fade-in zoom-in-95">
          <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 bg-emerald-100 rounded-full blur-2xl animate-pulse"></div>
            <div class="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl">
              <CheckCircle2 class="w-12 h-12" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-3xl font-black text-[#002147] tracking-tight">Identity Secured!</h2>
            <p class="text-slate-500 font-medium leading-relaxed">
              {{ message }} Your account is now fully active. Please save your Student ID below:
            </p>
          </div>

          <!-- Student ID Badge -->
          <div v-if="studentId" class="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] relative group/badge animate-in slide-in-from-bottom-2 duration-500">
             <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#002147] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Official Student ID</div>
             <h4 class="text-4xl font-black text-[#002147] tracking-tighter">{{ studentId }}</h4>
             <p class="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-[0.2em]">Use this credential to access your hub</p>
          </div>
          <button 
            @click="goToLogin"
            class="w-full bg-[#002147] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#002147]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Enter Portal Hub
            <ArrowRight class="w-5 h-5" />
          </button>
        </div>

        <!-- Error State -->
        <div v-else class="space-y-8 animate-in fade-in zoom-in-95">
          <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 bg-red-100 rounded-full blur-2xl"></div>
            <div class="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl">
              <XCircle class="w-12 h-12" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-3xl font-black text-[#002147] tracking-tight">Verification Failed</h2>
            <p class="text-slate-500 font-medium leading-relaxed text-sm">
              {{ message }}
            </p>
          </div>
          <div class="pt-4 flex flex-col gap-3">
            <button 
              @click="goToLogin"
              class="w-full bg-white border-2 border-slate-100 text-[#002147] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all font-bold"
            >
              Back to Login
            </button>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Need help? Contactregistrar@chcci.edu.ph
            </p>
          </div>
        </div>

      </div>

      <!-- Institutional Footer -->
      <p class="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
        Concepcion Holy Cross College Inc. Secure Gateway
      </p>

    </div>
  </div>
</template>

<style scoped>
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
</style>
