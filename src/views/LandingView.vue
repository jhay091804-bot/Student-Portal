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
  Files,
  Code,
  Coffee,
  HeartPulse,
  Calculator,
  Shield,
  Briefcase,
  Book,
  Trophy,
  Compass,
  Sparkles,
  Megaphone,
  Calendar,
  Info
} from 'lucide-vue-next';
import FloatingChatBot from '../components/FloatingChatBot.vue';
import SpookyAuth from '../components/SpookyAuth.vue';

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

const coreValues = [
  {
    title: 'Vision',
    desc: 'Concepcion Holy Cross College is an institution for academic and values formation offering relevant, learner centered and values oriented programs that produces competent persons of character in the service of society.',
    icon: Trophy,
    color: 'from-amber-400 to-orange-600'
  },
  {
    title: 'Mission',
    desc: 'To become a God-centered learning institution focused on holistic education that forms and educates individual to become concencious, competent, compassionate and committed persons towards the development of a just and humane society.',
    icon: Compass,
    color: 'from-blue-400 to-indigo-600'
  },
   {
    title: 'Hymm',
    desc: 'For once for all, We are rallying together Behind you Alma Matter dear who has elevated knowledge to us Inspiring us to sublimate your name We students and alumni Wherever we may be Near or far well always be loyal and ready to heed the call for in the hall of Holy Cross College are knowledge and love for God and country Radiates its light to our Alma Matter dear that guides as through the years.',
    icon: Compass,
    color: 'from-blue-400 to-indigo-600'
  }
];

const programs = [
  { name: 'BS Computer Science', code: 'BSCS', icon: Code, desc: 'Developing the next generation of software and AI leaders.' },
  { name: 'BS Information Systems', code: 'BSIS', icon: Globe, desc: 'Bridging technology and business with strategic digital solutions.' },
  { name: 'BS Computer Engineering', code: 'BSCE', icon: Zap, desc: 'Engineering the hardware and systems that power our future.' },
  { name: 'BS Nursing', code: 'BSN', icon: HeartPulse, desc: 'Compassionate care backed by clinical excellence and science.' },
  { name: 'BS Accountancy', code: 'BSA', icon: Calculator, desc: 'Precision and integrity for the global financial landscape.' },
  { name: 'BS Criminology', code: 'BSCrim', icon: Shield, desc: 'Serving justice and safety with ethics and tactical skill.' },
  { name: 'BS Education', code: 'BSED', icon: Book, desc: 'Inspiring minds and shaping the future through teaching.' }
];

onMounted(() => {
  store.fetchPublicAnnouncements();
});
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#D4AF37]/20 selection:text-[#002147] overflow-x-hidden">
    
    <!-- Professional Header (Glass Style) -->
    <header class="fixed top-0 inset-x-0 z-[100] h-20 border-b border-white/10 glass-card-dark">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white p-2 shadow-lg transform rotate-3 flex items-center justify-center overflow-hidden">
             <img src="/chcci-logo.png" alt="CHCCI Logo" class="w-full h-full object-contain" />
          </div>
          <div>
            <span class="block font-black text-xl leading-none tracking-tight text-white uppercase">CHCCI</span>
            <span class="text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase">Student Portal</span>
          </div>
        </div>
        
        <div class="hidden md:flex items-center gap-10">
           <a href="#mission" class="text-[10px] font-black text-white/70 hover:text-[#D4AF37] uppercase tracking-[0.2em] transition-colors">Objectives</a>
           <a href="#stats" class="text-[10px] font-black text-white/70 hover:text-[#D4AF37] uppercase tracking-[0.2em] transition-colors">Impact</a>
           <button 
             @click="openAuth('register')"
             class="bg-[#D4AF37] text-[#001A4D] px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:scale-105 transition-all shadow-lg active:scale-95"
           >
             Enroll Now
           </button>
        </div>
      </div>
    </header>

    <!-- Hero Section (Immersive Design) -->
    <main class="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-[#020617]">
      <!-- New Premium Backdrop (Enhanced Clarity) -->
      <img src="/campus_generated.png" class="absolute inset-0 w-full h-full object-cover opacity-60" alt="Campus Backdrop" />
      
      <!-- Animated Background Blobs -->
      <div class="blob w-96 h-96 bg-[#0f172a] top-[-10%] left-[-10%]"></div>
      <div class="blob w-[30rem] h-[30rem] bg-[#D4AF37]/10 bottom-[-20%] right-[-10%]" style="animation-delay: -5s;"></div>
      <div class="blob w-[40rem] h-[40rem] bg-[#0f172a] top-[20%] right-[10%]" style="animation-delay: -10s;"></div>

      <div class="max-w-7xl mx-auto px-6 relative z-10 w-full pt-10 sm:pt-0">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <!-- Left Content -->
          <div class="flex-1 space-y-10 text-center lg:text-left animate-reveal">
            <div class="inline-flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
              <ShieldCheck class="w-4 h-4 text-[#D4AF37]" />
              <span class="text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">Licensed & Accredited Institution</span>
            </div>
            
            <h1 class="text-5xl sm:text-7xl font-black tracking-tighter text-white leading-[0.95] font-cursive italic">
              Nurturing <br />
              <span class="text-[#D4AF37] drop-shadow-2xl">Minds.</span><br/>
              Building <br/>
              <span class="text-[#D4AF37] drop-shadow-2xl">Futures.</span>
            </h1>
            
            <p class="text-lg text-white/50 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Welcome to the official CHCCI Student Hub. Access your academic records, settle tuition, and stay updated with campus life—all in one secure place.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <button 
                @click="openAuth('register')"
                class="w-full sm:w-auto bg-[#D4AF37] text-[#001A4D] px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:text-[#001A4D] transition-all shadow-2xl shadow-[#D4AF37]/10 hover:-translate-y-2"
              >
                Enroll Now
              </button>
              <div class="hidden lg:flex items-center gap-3 text-white/30">
                 <div class="w-12 h-[1px] bg-white/10"></div>
                 <span class="text-[10px] font-bold uppercase tracking-widest">or sign in 👉</span>
              </div>
            </div>
          </div>

          <!-- Right Content: Glass Loading Card (Ultra Compact) -->
          <div class="w-full lg:w-[360px] animate-reveal" style="animation-delay: 0.2s;">
            <div class="glass-card-dark p-5 rounded-xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative group overflow-hidden">
               <!-- Subtle Grain Effect -->
               <div class="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
               
              <div class="mb-6 flex items-center justify-between relative z-10">
                <div>
                  <h3 class="text-2xl font-black text-white tracking-tight m-0">Portal Login</h3>
                  <p class="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1">Secured by CHCCI Systems</p>
                </div>
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#D4AF37] shadow-inner">
                   <Lock :size="20" />
                </div>
              </div>

              <SpookyAuth :onSuccess="() => {}" />

              <div class="mt-6 pt-6 border-t border-white/5 text-center relative z-10">
                 <p class="text-[11px] font-bold text-white/40 mb-4 uppercase tracking-widest">New Student?</p>
                 <button 
                   @click="openAuth('register')"
                   class="inline-flex items-center gap-2 text-white hover:text-[#D4AF37] font-black text-xs uppercase tracking-[0.2em] transition-colors"
                 >
                   Apply Online Today <ArrowRight :size="16" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Public Announcements Section -->
    <section v-if="store.announcements && store.announcements.length > 0" class="py-24 bg-[#020617] border-y border-white/5 relative overflow-hidden">
      <!-- Animated Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div class="space-y-4 text-center md:text-left">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
              <Megaphone class="w-4 h-4 text-[#D4AF37]" />
              <span class="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Official Bulletins</span>
            </div>
            <h2 class="text-4xl sm:text-5xl font-black text-white tracking-tighter">Campus Updates</h2>
          </div>
          <p class="text-white/40 font-medium max-w-md text-center md:text-right hidden sm:block">Stay informed with the latest news, examination schedules, and upcoming campus events direct from the administration.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="(ann, i) in store.announcements" 
            :key="ann.id"
            class="group p-8 rounded-[2.5rem] glass-card-dark border border-white/5 hover:bg-white/[0.07] transition-all duration-500 flex flex-col justify-between min-h-[340px] relative overflow-hidden"
          >
            <!-- Type Badge Icon -->
            <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
               <component :is="ann.type === 'exam' ? Calendar : (ann.type === 'event' ? Sparkles : Info)" class="w-8 h-8 text-white/10 group-hover:text-[#D4AF37]/20" />
            </div>

            <div class="space-y-6 relative z-10">
               <div class="flex items-center gap-3">
                  <span :class="['px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm', 
                    ann.type === 'exam' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    ann.type === 'event' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                    'bg-blue-500/10 text-blue-500 border border-blue-500/20']">
                    {{ ann.type }}
                  </span>
                  <div v-if="ann.target_date" class="flex items-center gap-1.5 text-white/30 text-[9px] font-bold uppercase tracking-widest">
                    <Calendar :size="12" /> {{ new Date(ann.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }}
                  </div>
               </div>

               <div>
                  <h3 class="text-2xl font-black text-white tracking-tight mb-4 group-hover:text-[#D4AF37] transition-colors leading-tight">{{ ann.title }}</h3>
                  <p class="text-white/50 text-sm font-medium leading-relaxed line-clamp-4">{{ ann.content }}</p>
               </div>
            </div>

            <div class="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
               <span class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{{ new Date(ann.created_at).toLocaleDateString() }}</span>
               <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#D4AF37] group-hover:text-[#002147] transition-all duration-500">
                  <ArrowRight :size="18" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Success Stats Center (Glass Style) -->
    <section id="stats" class="py-16 bg-[#020617] relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-6">
        <div class="glass-card rounded-2xl p-10 shadow-2xl relative z-10 animate-reveal">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center text-center space-y-4">
               <div class="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-[#D4AF37] backdrop-blur-sm shadow-inner transition-transform hover:scale-110">
                  <component :is="stat.icon" class="w-10 h-10" />
               </div>
               <div>
                  <h4 class="text-5xl font-black text-white tracking-tighter">{{ stat.value }}</h4>
                  <p class="text-[12px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mt-2">{{ stat.label }}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Objectives (Satisfying 3D Cards) -->
    <section id="mission" class="py-32 bg-[#020617] text-center relative overflow-hidden [perspective:2000px]">
       <!-- Decoration -->
       <div class="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <h2 class="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-4">Strategic Framework</h2>
        <h3 class="text-5xl font-black text-white mb-20 tracking-tighter">Campus Objectives</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="(obj, i) in objectives" :key="obj.title" class="group p-8 rounded-2xl glass-card-dark hover:bg-[#002C6A] transition-all duration-700 text-left relative overflow-hidden flex flex-col justify-between min-h-[400px] shadow-2xl hover:-translate-y-4 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-reveal" :style="{animationDelay: (i * 0.1) + 's'}">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[8rem] pointer-events-none transition-transform group-hover:scale-125"></div>
            
            <div class="relative z-10 w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-12 shadow-inner group-hover:scale-110 transition-transform border border-white/5">
               <component :is="obj.icon" class="w-10 h-10 text-[#D4AF37]" />
            </div>
            
            <div class="relative z-10">
              <h4 class="text-3xl font-black text-white mb-6 tracking-tight group-hover:text-[#D4AF37] transition-colors">{{ obj.title }}</h4>
              <p class="text-white/40 leading-relaxed font-semibold text-lg group-hover:text-white/70 transition-colors">{{ obj.desc }}</p>
            </div>

            <div class="mt-10 pt-10 border-t border-white/5">
               <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest relative">
                 Explore Perspective
                 <div class="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#D4AF37] transition-all group-hover:w-full"></div>
               </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vision & Mission (Split Premium Design) -->
    <section class="py-24 bg-[#020617] relative overflow-hidden">
      <!-- Decor -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
      
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div v-for="val in coreValues" :key="val.title" class="group relative p-12 rounded-[3rem] glass-card-dark border border-white/5 overflow-hidden transition-all duration-700 hover:scale-[1.02]">
              <div :class="['absolute top-0 right-0 w-64 h-64 bg-gradient-to-br opacity-5 rounded-bl-[10rem] transition-all group-hover:opacity-10', val.color]"></div>
              
              <div :class="['w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white mb-8 shadow-2xl transition-transform group-hover:rotate-6', val.color]">
                 <component :is="val.icon" :size="32" />
              </div>
              
              <h4 class="text-4xl font-black text-white mb-6 tracking-tight">{{ val.title }}</h4>
              <p class="text-lg text-white/50 font-semibold leading-relaxed">{{ val.desc }}</p>

              <div class="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                 <Sparkles :size="16" /> Legacy of Excellence
              </div>
           </div>
        </div>
      </div>
    </section>

    <!-- Courses / Programs Showcase (The 7 Pillars) -->
    <section class="py-32 bg-[#020617] relative">
      <div class="max-w-7xl mx-auto px-6 text-center">
        <div class="inline-flex items-center gap-3 px-6 py-2 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 mb-6">
           <GraduationCap class="w-4 h-4 text-[#D4AF37]" />
           <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Official Course Offerings</span>
        </div>
        <h2 class="text-5xl font-black text-white mb-20 tracking-tighter">Academic Pathways</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <div v-for="prog in programs" :key="prog.code" class="group p-8 rounded-[2rem] glass-card-dark border border-white/5 transition-all duration-500 hover:bg-white/5 text-left relative overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="relative z-10">
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-8 group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#002147] transition-all duration-500">
                   <component :is="prog.icon" :size="28" />
                </div>
                <h4 class="text-xl font-bold text-white mb-3 tracking-tight">{{ prog.name }}</h4>
                <p class="text-sm text-white/40 font-medium leading-relaxed">{{ prog.desc }}</p>
              </div>

              <div class="relative z-10 mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                 <span class="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">Accredited Program</span>
                 <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#D4AF37]">
                    <ArrowRight :size="16" />
                 </div>
              </div>
           </div>

           <!-- Large Enroll CTA Card (Fills 7th spot or more) -->
           <div class="lg:col-span-2 p-12 rounded-[2rem] bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-[#002147] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer shadow-2xl shadow-[#D4AF37]/20 hover:-translate-y-2 transition-all" @click="openAuth('register')">
              <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div class="relative z-10 text-center md:text-left">
                 <h4 class="text-4xl font-black tracking-tighter mb-2">Ready to Join Us?</h4>
                 <p class="text-[11px] font-black uppercase tracking-[0.3em] opacity-80">Online enrollment for A.Y. 2026-2027 is now open.</p>
              </div>
              <button class="relative z-10 px-12 py-5 bg-[#002147] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl group-hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                 Enroll Now <ArrowRight :size="20" />
              </button>
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
        <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] p-0 overflow-hidden animate-in zoom-in-95">
          <!-- Close Button -->
          <button @click="showAuthModal = false" class="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 z-50">
            <X :size="24" />
          </button>

          <div class="flex flex-col md:flex-row min-h-[500px]">
            <!-- Side Info Branding (Left) -->
            <div class="hidden md:flex w-1/3 bg-[#002147] p-10 flex-col justify-between text-white relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
               <div class="relative z-10">
                  <div class="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center shadow-xl overflow-hidden mb-8">
                    <img src="/chcci-logo.png" alt="CHCCI Logo" class="w-full h-full object-contain" />
                  </div>
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

                <!-- Spooky Interactive Login -->
                <div v-else-if="authMode === 'login'" class="animate-in slide-in-from-right-4 duration-300">
                  <div class="mb-6">
                    <h2 class="text-2xl font-black text-[#002147] tracking-tight m-0">Welcome Back</h2>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Portal Access</p>
                  </div>
                  
                  <SpookyAuth :onSuccess="() => showAuthModal = false" />

                  <div class="pt-6 text-center">
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
                        <option value="BSCS">BS in Computer Science</option>
                        <option value="BSIT">BS in Information Technology</option>
                        <option value="BSHM">BS in Hospitality Management</option>
                        <option value="BSN">BS in Nursing</option>
                        <option value="BSA">BS in Accountancy</option>
                        <option value="BSCrim">BS in Criminology</option>
                        <option value="BSBA">BS in Business Administration</option>
                        <option value="BSED">BS in Education</option>
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
                  <button @click="showAuthModal = false" class="text-[10px] font-black text-slate-400 hover:text-[#002147] uppercase tracking-widest transition-colors">Already Enrolled? Sign In</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </transition>

    <FloatingChatBot />

    <!-- Corporate Footer (HCC Style) -->
    <footer class="py-24 bg-[#0f172a] relative z-10 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-12 border-b border-white/10 pb-16 mb-16 px-10">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 bg-white rounded-[2rem] p-3 flex items-center justify-center shadow-2xl overflow-hidden">
               <img src="/chcci-logo.png" alt="CHCCI Logo" class="w-full h-full object-contain" />
            </div>
            <div>
               <h4 class="text-white font-black text-2xl uppercase m-0">CHCCI Portal</h4>
               <p class="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] m-0">Gateway to Excellence</p>
            </div>
          </div>
          <div class="flex gap-12">
             <div class="text-left space-y-2">
                <p class="text-[10px] font-black text-white/40 uppercase tracking-widest">Connect</p>
                <div class="flex gap-6">
                   <a href="#" class="text-white/60 hover:text-[#D4AF37] transition-colors"><Globe :size="20"/></a>
                   <a href="#" class="text-white/60 hover:text-[#D4AF37] transition-colors"><Mail :size="20"/></a>
                </div>
             </div>
             <div class="text-left space-y-2">
                <p class="text-[10px] font-black text-white/40 uppercase tracking-widest">Location</p>
                <p class="text-white/80 font-bold text-xs uppercase tracking-tight">Concepcion, Tarlac</p>
             </div>
          </div>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-8 px-10">
           <p class="text-[11px] font-black text-white/30 uppercase tracking-widest">© 2026 Core Gateway College Inc. All Rights Reserved.</p>
           <div class="flex gap-10">
              <a href="#" class="text-[11px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" class="text-[11px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">Terms of Service</a>
           </div>
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
