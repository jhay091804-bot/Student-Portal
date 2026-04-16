<script setup>
import { ref, reactive, computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';
import { User, Mail, GraduationCap, ArrowRight, ArrowLeft, Loader2, CheckCircle, ShieldCheck, Lock, Eye, EyeOff, Check, X, Files } from 'lucide-vue-next';

const store = usePortalStore();
const router = useRouter();

const form = reactive({
  name: '',
  email: '',
  program: 'BSCS',
  year: '1st Year',
  password: '',
  confirmPassword: ''
});

const showPassword = ref(false);
const generatedId = ref('');
const isSuccess = ref(false);
const error = ref('');

const passwordCriteria = [
  { label: '8+ Characters', met: (p) => p.length >= 8 },
  { label: 'Uppercase & Lowercase', met: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'One Number', met: (p) => /[0-9]/.test(p) },
  { label: 'Special Character', met: (p) => /[^A-Za-z0-9]/.test(p) }
];

const passwordStrength = computed(() => {
  const metCount = passwordCriteria.filter(c => c.met(form.password)).length;
  if (!form.password) return { label: 'None', color: 'bg-gray-100', width: '0%', text: 'text-gray-400' };
  if (metCount <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%', text: 'text-red-500' };
  if (metCount <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '50%', text: 'text-orange-500' };
  if (metCount <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '75%', text: 'text-yellow-500' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%', text: 'text-green-500' };
});

const handleRegister = async () => {
  if (!form.name || !form.email || !form.password) {
    error.value = 'Please complete all required fields.';
    return;
  }
  
  if (passwordStrength.value.label !== 'Strong') {
    error.value = 'Please use a stronger password that meets all security criteria.';
    return;
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.';
    return;
  }
  
  error.value = '';
  // Rest of registration logic
  generatedId.value = `5176${Math.floor(Math.random() * 9000) + 1000}`;
  const result = await store.signUp({
    name: form.name,
    program: form.program,
    year: form.year,
    id: generatedId.value,
    password: form.password
  });
  
  if (result === true || result?.success) {
    isSuccess.value = true;
  } else {
    error.value = result?.message || 'Registration failed. Please try again.';
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex bg-[#f8fafc] overflow-hidden">
    
    <!-- Left Side: Registration Info (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-accent relative items-center justify-center p-12 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      
      <div class="relative z-10 text-center max-w-sm">
        <h1 class="text-4xl font-black text-white tracking-tight mb-4">Start Your Journey</h1>
        <p class="text-white/70 leading-relaxed font-medium">
          Join the CHCCI community and gain access to a world-class education and comprehensive student services.
        </p>
        
        <div class="mt-12 space-y-4">
          <div v-for="step in ['Personal Details', 'Course Selection', 'ID Assignment']" :key="step" class="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-white">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">{{ step[0] }}</div>
            <p class="text-sm font-bold tracking-wide uppercase">{{ step }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side: Register Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 animate-in slide-in-from-left-10 duration-500">
      <div class="w-full max-w-md space-y-8">
        
        <div v-if="!isSuccess" class="space-y-8">
          <div class="text-center lg:text-left">
            <router-link to="/login" class="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors mb-6 group">
              <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </router-link>
            <h2 class="text-3xl font-black text-gray-900 leading-tight">Student Enrollment</h2>
            <p class="text-gray-500 mt-2 font-medium">Enter your details to create your student portal account.</p>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-6">
            <div v-if="error" class="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in shake">
              <ShieldCheck class="w-4 h-4 shrink-0" />
              {{ error }}
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Student Name</label>
              <div class="relative group">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                  <User class="w-5 h-5" />
                </span>
                <input 
                  v-model="form.name"
                  type="text" 
                  placeholder="e.g., John Doe" 
                  class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div class="relative group">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                  <Mail class="w-5 h-5" />
                </span>
                <input 
                  v-model="form.email"
                  type="email" 
                  placeholder="j.doe@example.com" 
                  class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Academic Program</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                    <GraduationCap class="w-5 h-5" />
                  </span>
                  <select 
                    v-model="form.program"
                    class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700 appearance-none"
                  >
                    <option value="BSCS">BS in Computer Science</option>
                    <option value="BSHM">BS in Hospitality Management</option>
                    <option value="BSN">BS in Nursing</option>
                    <option value="BSA">BS in Accountancy</option>
                    <option value="BSCrim">BS in Criminology</option>
                    <option value="BSBA">BS in Business Administration</option>
                    <option value="BSED">BS in Education</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Year Level</label>
                <select 
                  v-model="form.year"
                  class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700 appearance-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <!-- Password Fields -->
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Set Portal Password</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                    <Lock class="w-5 h-5" />
                  </span>
                  <input 
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'" 
                    @copy.prevent 
                    @paste.prevent 
                    @contextmenu.prevent
                    placeholder="Create a strong password" 
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
                
                <!-- Password Strength Meter -->
                <div v-if="form.password" class="space-y-2 px-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-widest" :class="passwordStrength.text">Strength: {{ passwordStrength.label }}</span>
                  </div>
                  <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div :class="['h-full transition-all duration-500', passwordStrength.color]" :style="{ width: passwordStrength.width }"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <div v-for="criterion in passwordCriteria" :key="criterion.label" class="flex items-center gap-2">
                      <component :is="criterion.met(form.password) ? Check : X" :class="['w-3 h-3', criterion.met(form.password) ? 'text-green-500' : 'text-gray-300']" />
                      <span :class="['text-[9px] font-bold uppercase tracking-tight', criterion.met(form.password) ? 'text-gray-700' : 'text-gray-400']">{{ criterion.label }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                    <Lock class="w-5 h-5" />
                  </span>
                  <input 
                    v-model="form.confirmPassword"
                    :type="showPassword ? 'text' : 'password'" 
                    @copy.prevent 
                    @paste.prevent 
                    @contextmenu.prevent
                    placeholder="Repeat your password" 
                    class="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-bold text-gray-700"
                  />
                  <div v-if="form.confirmPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Check v-if="form.password === form.confirmPassword" class="w-5 h-5 text-green-500" />
                    <X v-else class="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              :disabled="store.authLoading"
              class="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <template v-if="!store.authLoading">
                Register Student
                <ArrowRight class="w-5 h-5" />
              </template>
              <template v-else>
                <Loader2 class="w-5 h-5 animate-spin" />
                Registering...
              </template>
            </button>
          </form>
        </div>

        <!-- Success View with Generated ID -->
        <div v-else class="text-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
          
          <!-- File Merging Animation -->
          <div class="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
             <div class="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
             <!-- Document 1 -->
             <div class="absolute left-0 animate-merge-left opacity-30">
                <Files class="w-12 h-12 text-primary" />
             </div>
             <!-- Document 2 -->
             <div class="absolute right-0 animate-merge-right opacity-30">
                <Files class="w-12 h-12 text-[#D4AF37]" />
             </div>
             <!-- Result Folder (Appears after merge) -->
             <div class="relative z-10 animate-scale-in">
                <div class="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                   <ShieldCheck class="w-10 h-10" />
                </div>
             </div>
          </div>

          <div class="relative inline-block">
            <div class="absolute inset-0 bg-green-100 rounded-full blur-xl animate-pulse"></div>
            <div class="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-200 mx-auto">
              <CheckCircle class="w-12 h-12" />
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-3xl font-black text-gray-900 leading-tight">Enrollment Success!</h3>
            <p class="text-gray-500 font-medium leading-relaxed">
              Welcome to CHCCI, <strong>{{ form.name }}</strong>! Your account has been created.
            </p>
          </div>

          <!-- Highlighted Student ID -->
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-[2rem] relative group overflow-hidden">
             <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Official Student ID</p>
             <h4 class="text-4xl font-black text-primary tracking-tighter">{{ generatedId }}</h4>
             <p class="text-[10px] text-gray-400 mt-2">Please use this ID to log in to the portal.</p>
          </div>

          <div class="pt-4 space-y-4">
            <router-link 
              to="/login"
              class="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Continue to Login
              <ArrowRight class="w-5 h-5" />
            </router-link>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Saving record to campus database...</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes merge-left {
  0% { transform: translateX(0); opacity: 0; }
  20% { transform: translateX(0); opacity: 1; }
  80% { transform: translateX(40px); opacity: 0; }
  100% { transform: translateX(40px); opacity: 0; }
}

@keyframes merge-right {
  0% { transform: translateX(0); opacity: 0; }
  20% { transform: translateX(0); opacity: 1; }
  80% { transform: translateX(-40px); opacity: 0; }
  100% { transform: translateX(-40px); opacity: 0; }
}

@keyframes scale-in {
  0%, 70% { transform: scale(0); opacity: 0; }
  85% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-merge-left {
  animation: merge-left 3s infinite ease-in-out;
}

.animate-merge-right {
  animation: merge-right 3s infinite ease-in-out;
}

.animate-scale-in {
  animation: scale-in 3s infinite ease-out;
}

.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
