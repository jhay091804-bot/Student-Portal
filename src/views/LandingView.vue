<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePortalStore } from '../stores/portalStore';
import { 
  GraduationCap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  CreditCard, 
  Bell, 
  Zap,
  Globe,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  X,
  Target,
  Award,
  Users,
  CheckCircle2,
  BookOpen,
  Mail,
  Check,
  Files
} from 'lucide-vue-next';
import FloatingChatBot from '../components/FloatingChatBot.vue';

const router = useRouter();
const store = usePortalStore();

// --- Auth Modal State ---
const showAuthModal = ref(false);
const authMode = ref('login'); // 'login' | 'register'
const isSuccess = ref(false);
const generatedId = ref('');

// --- Login State ---
const studentId = ref('');
const password = ref('');
const showPassword = ref(false);
const loginError = ref('');
const isAuthenticating = ref(false);

// --- Register State ---
const registerForm = reactive({
  name: '',
  email: '',
  program: 'BSCS',
  year: '1st Year',
  password: '',
  confirmPassword: ''
});
const registerError = ref('');

// Verification State
const verificationDetails = reactive({
  email: '',
  sent: false
});

const openAuth = (mode = 'login') => {
  authMode.value = mode;
  isSuccess.value = false;
  verificationDetails.sent = false;
  loginError.value = '';
  registerError.value = '';
  showAuthModal.value = true;
};

const toggleMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login';
  isSuccess.value = false;
  verificationDetails.sent = false;
  loginError.value = '';
  registerError.value = '';
};

// --- Login Logic ---
const handleLogin = async () => {
  if (!studentId.value || !password.value) {
    loginError.value = 'Please enter both Student ID and Password.';
    return;
  }
  
  isAuthenticating.value = true;
  loginError.value = '';
  
  const result = await store.signIn(studentId.value, password.value);
  
  if (result === true || result?.success) {
    showAuthModal.value = false;
    if (store.isAdmin) {
      router.push({ name: 'admin' });
    } else {
      router.push({ name: 'dashboard' });
    }
  } else {
    // Check if it's a verification error
    if (result === 'Email verification required.' || result?.unverified) {
      verificationDetails.email = result?.email || 'your email';
      verificationDetails.sent = true;
      authMode.value = 'verify';
    } else {
      loginError.value = result?.message || result || 'Invalid credentials. Please try again.';
    }
  }
  isAuthenticating.value = false;
};

// --- Register Logic ---
const passwordCriteria = [
  { label: '8+ Characters', met: (p) => p.length >= 8 },
  { label: 'Uppercase & Lowercase', met: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'One Number', met: (p) => /[0-9]/.test(p) },
  { label: 'Special Character', met: (p) => /[^A-Za-z0-9]/.test(p) }
];

const passwordStrength = computed(() => {
  const p = registerForm.password;
  const metCount = passwordCriteria.filter(c => c.met(p)).length;
  if (!p) return { label: 'None', color: 'bg-slate-100', width: '0%', text: 'text-slate-400' };
  if (metCount <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%', text: 'text-red-500' };
  if (metCount <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '50%', text: 'text-orange-500' };
  if (metCount <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '75%', text: 'text-yellow-500' };
  return { label: 'Strong', color: 'bg-emerald-500', width: '100%', text: 'text-emerald-500' };
});

const handleRegister = async () => {
  if (!registerForm.name || !registerForm.email || !registerForm.password) {
    registerError.value = 'Please complete all required fields.';
    return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = 'Passwords do not match.';
    return;
  }
  
  isAuthenticating.value = true;
  registerError.value = '';
  
  // Generating Mock Student ID
  const studentIdGenerated = `5176${Math.floor(Math.random() * 9000) + 1000}`;
  
  const result = await store.signUp({
    ...registerForm,
    id: studentIdGenerated
  });
  
  if (result === true || result?.success || result?.unverified) {
    verificationDetails.email = registerForm.email;
    verificationDetails.sent = true;
    authMode.value = 'verify';
  } else {
    // Backend returns 'error' field now for specific validation/database issues
    const errorMsg = result?.error || result?.message || (typeof result === 'string' ? result : 'Registration failed. Please try again.');
    registerError.value = errorMsg;
  }
  isAuthenticating.value = false;
};

// --- UI Data ---
const objectives = [
  {
    title: 'Academic Excellence',
    desc: 'Empowering students with real-time access to grades and schedules for a streamlined experience.',
    icon: GraduationCap,
    color: 'bg-[#002147]/5 text-[#002147]'
  },
  {
    title: 'Financial Modernization',
    desc: 'Seamless tuition settlement via GCash, Maya, and Online Banking directly within the student hub.',
    icon: CreditCard,
    color: 'bg-[#D4AF37]/10 text-[#D4AF37]'
  },
  {
    title: 'Campus Connectivity',
    desc: 'Instant access to official announcements and updates, keeping you connected 24/7.',
    icon: Bell,
    color: 'bg-emerald-50 text-emerald-600'
  }
];

const stats = [
  { label: 'Licensed Graduates', value: '50,000+', icon: Users },
  { label: 'Official Level', value: 'Level III', icon: Award },
  { label: 'National Success', value: '98%', icon: Target }
];
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#D4AF37]/20 selection:text-[#002147] overflow-x-hidden">
    
    <!-- Professional Header -->
    <header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 h-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
             <span class="text-white font-black text-xl tracking-tight">C</span>
          </div>
          <div>
            <span class="block font-black text-lg leading-none tracking-tight text-[#002147]">CHCCI</span>
            <span class="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Student Portal</span>
          </div>
        </div>
        
        <div class="hidden md:flex items-center gap-10">
           <a href="#mission" class="text-xs font-bold text-slate-500 hover:text-[#002147] uppercase tracking-widest transition-colors">Mission</a>
           <a href="#stats" class="text-xs font-bold text-slate-500 hover:text-[#002147] uppercase tracking-widest transition-colors">Stats</a>
           <button 
             @click="openAuth('login')"
             class="bg-[#002147] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#003366] transition-all shadow-xl shadow-[#002147]/20 active:scale-95"
           >
             Access My Portal
           </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="relative z-10 pt-32 pb-20">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div class="flex-1 space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left-10 duration-1000">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#002147]/5 rounded-full border border-[#002147]/10">
              <CheckCircle2 class="w-4 h-4 text-[#002147]" />
              <span class="text-[10px] font-black text-[#002147] uppercase tracking-[0.2em]">Official Educational Gateway</span>
            </div>
            
            <h1 class="text-5xl sm:text-7xl font-black tracking-tight text-[#002147] leading-[1.1]">
              Nurturing Minds <br />
              <span class="text-[#D4AF37]">Building Futures.</span>
            </h1>
            
            <p class="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Empowering the youth through quality education and a world-class digital campus. CHCCI provides a seamless portal for your academic and financial records.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                @click="openAuth('login')"
                class="w-full sm:w-auto bg-[#002147] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#003366] transition-all shadow-2xl shadow-[#002147]/20 hover:-translate-y-1"
              >
                Access Portal
              </button>
              <button 
                @click="openAuth('register')"
                class="w-full sm:w-auto bg-white text-[#002147] px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-[#002147]/10 hover:bg-slate-50 transition-all"
              >
                Enroll Now
              </button>
            </div>
          </div>

          <!-- Hero Image -->
          <div class="flex-1 relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            <div class="relative bg-white p-4 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop" 
                class="rounded-[2rem] w-full shadow-inner"
                alt="Student Life"
              />
              <div class="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4 animate-bounce-slow">
                 <div class="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shadow-inner">
                    <Award :size="24" />
                 </div>
                 <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success</p>
                    <p class="text-sm font-black text-[#002147]">Certified Quality</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Success Stats Center -->
    <section id="stats" class="py-24 bg-slate-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center text-center space-y-4">
             <div class="w-16 h-16 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-[#002147]">
                <component :is="stat.icon" class="w-8 h-8" />
             </div>
             <div>
                <h4 class="text-4xl font-black text-[#002147] tracking-tighter">{{ stat.value }}</h4>
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{{ stat.label }}</p>
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Objectives -->
    <section id="mission" class="py-32 bg-white text-center">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-4">The Strategic Path</h2>
        <h3 class="text-4xl font-black text-[#002147] mb-20 tracking-tight">Portal Objectives</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div v-for="obj in objectives" :key="obj.title" class="group p-10 rounded-[2.5rem] bg-white border border-slate-50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left">
            <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:scale-110', obj.color]">
              <component :is="obj.icon" class="w-8 h-8" />
            </div>
            <h4 class="text-xl font-black text-[#002147] mb-4 tracking-tight">{{ obj.title }}</h4>
            <p class="text-slate-500 leading-relaxed font-medium text-sm">{{ obj.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- UNIFIED AUTHENTICATION MODAL -->
    <transition
      enter-active-class="transition duration-400 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showAuthModal" class="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <!-- Backdrop -->
        <div @click="showAuthModal = false" class="absolute inset-0 bg-[#002147]/40 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] p-0 overflow-hidden animate-in zoom-in-95">
          <!-- Close Button -->
          <button @click="showAuthModal = false" class="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 z-50">
            <X :size="24" />
          </button>

          <div class="flex flex-col md:flex-row min-h-[500px]">
            <!-- Side Info Branding (Left) -->
            <div class="hidden md:flex w-1/3 bg-[#002147] p-10 flex-col justify-between text-white relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
               <div class="relative z-10">
                  <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#002147] font-black text-2xl italic mb-8">C</div>
                  <h4 class="text-xl font-black leading-tight tracking-tight mb-4">CHCCI <br/> Academic Portal</h4>
                  <p class="text-xs text-white/50 font-bold leading-relaxed">Nurturing minds, building futures with next-gen digital student services.</p>
               </div>
               <div class="relative z-10 flex gap-2">
                 <ShieldCheck class="w-4 h-4 text-[#D4AF37]" />
                 <span class="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Secure Session</span>
               </div>
            </div>

            <!-- Form Area (Right) -->
            <div class="flex-1 p-8 md:p-12 relative overflow-y-auto max-h-[90vh] custom-scrollbar">
              
              <!-- Verification Pending State -->
              <div v-if="authMode === 'verify'" class="text-center py-4 space-y-6 animate-in zoom-in-95">
                 <div class="w-24 h-24 bg-blue-50 rounded-[2.5rem] mx-auto flex items-center justify-center text-blue-500 shadow-xl shadow-blue-100">
                    <Mail class="w-12 h-12" />
                 </div>
                 <div class="space-y-2">
                    <h3 class="text-2xl font-black text-[#002147]">Check Your Email</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">
                       We've sent a verification link to <strong>{{ verificationDetails.email }}</strong>. Please click the link to confirm your identity.
                    </p>
                 </div>
                 <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-relaxed">
                       Can't find it? Check your spam folder or wait a few minutes.
                    </p>
                 </div>
                 <button @click="authMode = 'login'" class="w-full border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Back to Login</button>
              </div>

              <!-- Success/Merging State (Original logic preserved for direct login flow) -->
              <div v-else-if="isSuccess" class="text-center py-4 space-y-6 animate-in zoom-in-95">
                 <div class="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                    <div class="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
                    <div class="absolute left-0 animate-merge-left opacity-30"><Files class="w-12 h-12 text-primary" /></div>
                    <div class="absolute right-0 animate-merge-right opacity-30"><Files class="w-12 h-12 text-[#D4AF37]" /></div>
                    <div class="relative z-10 animate-scale-in">
                       <div class="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                          <Check class="w-10 h-10" />
                       </div>
                    </div>
                 </div>
                 <h3 class="text-2xl font-black text-[#002147]">Registration Success!</h3>
                 <div class="bg-slate-50 border-2 border-dashed border-slate-100 p-6 rounded-[2rem]">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Official Student ID</p>
                    <h4 class="text-3xl font-black text-[#002147] tracking-tighter">{{ generatedId }}</h4>
                    <p class="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Please use this to login</p>
                 </div>
                 <button @click="toggleMode" class="w-full bg-[#002147] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200">Continue to Login</button>
              </div>

              <!-- Login Form -->
              <div v-else-if="authMode === 'login'" class="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <!-- Waving Figure Greeting -->
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-16 h-16 relative">
                    <svg viewBox="0 0 100 100" class="w-full h-full text-[#002147] fill-current">
                       <circle cx="50" cy="35" r="15" />
                       <path d="M35 55 Q50 50 65 55 L60 85 L40 85 Z" />
                       <g class="animate-wave"><path d="M35 55 L20 40 L25 35 Z" /></g>
                       <path d="M65 55 L80 70 L75 75 Z" />
                    </svg>
                    <div class="absolute -top-2 -right-4 animate-bounce bg-[#D4AF37] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">Hello!</div>
                  </div>
                  <div>
                    <h2 class="text-2xl font-black text-[#002147] tracking-tight m-0">Welcome Back</h2>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal Access Node</p>
                  </div>
                </div>

                <form @submit.prevent="handleLogin" class="space-y-5">
                  <div v-if="loginError" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[10px] font-bold uppercase text-center animate-in shake">{{ loginError }}</div>
                  
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID</label>
                    <div class="relative group">
                      <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#002147]"><User :size="18" /></span>
                      <input v-model="studentId" type="text" placeholder="2021-0042" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#002147] font-bold text-sm text-[#002147]" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div class="relative group">
                      <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#002147]"><Lock :size="18" /></span>
                      <input v-model="password" :type="showPassword ? 'text' : 'password'" @copy.prevent @paste.prevent @contextmenu.prevent placeholder="••••••••" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:border-[#002147] font-bold text-sm text-[#002147]" />
                      <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400"><Eye v-if="!showPassword" :size="18" /><EyeOff v-else :size="18" /></button>
                    </div>
                  </div>

                  <button type="submit" :disabled="isAuthenticating" class="w-full bg-[#002147] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                    <template v-if="!isAuthenticating">Sign In <ArrowRight :size="14"/></template>
                    <template v-else><Loader2 class="animate-spin" :size="14"/> Authenticating</template>
                  </button>
                </form>

                <div class="pt-4 text-center">
                  <button @click="toggleMode" class="text-[10px] font-black text-slate-400 hover:text-[#002147] uppercase tracking-widest transition-colors">New Student? Enroll Today</button>
                </div>
              </div>

              <!-- Register Form -->
              <div v-else class="space-y-6 animate-in slide-in-from-left-4 duration-300">
                <div class="space-y-1">
                  <h2 class="text-2xl font-black text-[#002147] tracking-tight">Create Account</h2>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Enrollment Hub</p>
                </div>

                <form @submit.prevent="handleRegister" class="space-y-4">
                  <div v-if="registerError" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[10px] font-bold uppercase text-center">{{ registerError }}</div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input v-model="registerForm.name" type="text" placeholder="Juan Dela Cruz" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#002147] font-bold text-xs" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input v-model="registerForm.email" type="email" placeholder="student@chcci.edu.ph" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#002147] font-bold text-xs" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                      <select v-model="registerForm.program" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#002147] font-bold text-xs">
                        <option value="BSCS">BSCS</option><option value="BSIT">BSIT</option><option value="BSBA">BSBA</option>
                      </select>
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Year</label>
                      <select v-model="registerForm.year" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#002147] font-bold text-xs">
                        <option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option>
                      </select>
                    </div>
                  </div>

                  <div class="space-y-4 pt-2">
                    <div class="space-y-1">
                       <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                       <input v-model="registerForm.password" :type="showPassword ? 'text' : 'password'" @copy.prevent @paste.prevent @contextmenu.prevent placeholder="••••••••" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#002147] font-bold text-xs" />
                    </div>
                    <!-- Strength Simple -->
                    <div v-if="registerForm.password" class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div :class="['h-full transition-all', passwordStrength.color]" :style="{width: passwordStrength.width}"></div>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
                       <input v-model="registerForm.confirmPassword" :type="showPassword ? 'text' : 'password'" @copy.prevent @paste.prevent @contextmenu.prevent placeholder="••••••••" class="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#002147] font-bold text-xs" />
                    </div>
                  </div>

                  <button type="submit" :disabled="isAuthenticating" class="w-full bg-[#002147] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 mt-4">
                    <template v-if="!isAuthenticating">Complete Enrollment</template>
                    <template v-else>Registering Student...</template>
                  </button>
                </form>

                <div class="text-center">
                  <button @click="toggleMode" class="text-[10px] font-black text-slate-400 hover:text-[#002147] uppercase tracking-widest transition-colors">Already Enrolled? Sign In</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </transition>

    <FloatingChatBot />

    <!-- Corporate Footer -->
    <footer class="py-16 bg-white border-t border-slate-100 relative z-10">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
        <div>
           <p class="text-[10px] font-black text-slate-900 uppercase tracking-widest">© 2026 Core Gateway College Inc.</p>
           <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Concepcion, Tarlac, Philippines</p>
        </div>
        <div class="flex gap-10">
           <a href="#" class="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#002147]">Privacy</a>
           <a href="#" class="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#002147]">Help</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
.animate-bounce-slow { animation: bounce-slow 4s infinite ease-in-out; }
@keyframes wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } }
.animate-wave { animation: wave 1.5s infinite ease-in-out; transform-origin: 35px 55px; }

@keyframes merge-left { 0% { transform: translateX(0); opacity: 0; } 20% { transform: translateX(0); opacity: 1; } 80% { transform: translateX(40px); opacity: 0; } 100% { transform: translateX(40px); opacity: 0; } }
@keyframes merge-right { 0% { transform: translateX(0); opacity: 0; } 20% { transform: translateX(0); opacity: 1; } 80% { transform: translateX(-40px); opacity: 0; } 100% { transform: translateX(-40px); opacity: 0; } }
@keyframes scale-in { 0%, 70% { transform: scale(0); opacity: 0; } 85% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.animate-merge-left { animation: merge-left 3s infinite ease-in-out; }
.animate-merge-right { animation: merge-right 3s infinite ease-in-out; }
.animate-scale-in { animation: scale-in 3s infinite ease-out; }

.shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
