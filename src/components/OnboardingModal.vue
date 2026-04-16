<script setup>
import { ref, computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { 
  User, 
  MapPin, 
  Phone, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-vue-next';

const store = usePortalStore();
const currentStep = ref(1);
const isSubmitting = ref(false);

const form = ref({
  address: '',
  phone: '',
  age: '',
  religion: '',
  height: '',
  weight: '',
  birthdate: '',
  nationality: 'Filipino'
});

const steps = [
  { id: 1, title: 'Personal Info', icon: MapPin },
  { id: 2, title: 'Contact Details', icon: Phone },
  { id: 3, title: 'Personal Identity', icon: User }
];

const progress = computed(() => (currentStep.value / steps.length) * 100);

const isStepValid = computed(() => {
  if (currentStep.value === 1) return form.value.address.length > 5;
  if (currentStep.value === 2) return form.value.phone.length >= 10;
  if (currentStep.value === 3) {
    return form.value.age && 
           form.value.religion && 
           form.value.height && 
           form.value.weight && 
           form.value.birthdate && 
           form.value.nationality;
  }
  return false;
});

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const handleSubmit = async () => {
  if (!isStepValid.value) return;
  
  isSubmitting.value = true;
  const success = await store.onboardUser(form.value);
  isSubmitting.value = false;
  
  if (success) {
    // Parent will re-evaluate user.is_onboarded and close modal automatically
  } else {
    alert('Something went wrong. Please try again.');
  }
};

const religions = ['Roman Catholic', 'Christian', 'Iglesia ni Cristo', 'Islam', 'Seventh-day Adventist', 'Other'];
const nationalities = ['Filipino', 'American', 'Chinese', 'Japanese', 'Korean', 'Other'];
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
    <div class="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
      
      <!-- Sidebar / Progress (Hidden on mobile) -->
      <div class="hidden md:flex w-64 bg-slate-900 p-8 flex-col justify-between relative overflow-hidden">
        <div class="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
          <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
            <Sparkles class="text-white" :size="24" />
          </div>
          <h2 class="text-white font-black text-xl leading-tight mb-2 tracking-tight">Complete Your Profile</h2>
          <p class="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Let's set up your individual student gateway.</p>
        </div>

        <nav class="space-y-6 relative z-10">
          <div v-for="step in steps" :key="step.id" class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 border-2',
              currentStep === step.id ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' : 
              currentStep > step.id ? 'bg-green-500 border-green-500 text-white' : 'border-slate-700 text-slate-500'
            ]">
              <CheckCircle2 v-if="currentStep > step.id" :size="16" />
              <span v-else>{{ step.id }}</span>
            </div>
            <span :class="['text-xs font-black uppercase tracking-widest transition-colors duration-300', currentStep === step.id ? 'text-white' : 'text-slate-500']">
              {{ step.title }}
            </span>
          </div>
        </nav>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 p-8 md:p-12 flex flex-col justify-between min-h-[550px]">
        
        <header class="mb-8">
          <div class="md:hidden flex items-center justify-between mb-4">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Step {{ currentStep }} of 3</span>
            <div class="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
          <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <component :is="steps[currentStep-1].icon" class="text-primary" :size="28" />
             {{ steps[currentStep-1].title }}
          </h3>
          <p class="text-slate-500 text-sm mt-2 font-medium">Please provide accurate information for your official records.</p>
        </header>

        <!-- Form Steps -->
        <main class="flex-1">
          <transition 
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-x-4"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-4"
            mode="out-in"
          >
            <!-- Step 1: Personal -->
            <div v-if="currentStep === 1" key="step1" class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Identity</label>
                <div class="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center gap-4 group transition-all">
                  <User class="text-slate-300 group-focus-within:text-primary transition-colors" :size="20" />
                  <span class="text-slate-900 font-black">{{ store.user?.name }}</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Residential Address</label>
                <textarea 
                  v-model="form.address"
                  placeholder="Street, City, Province..." 
                  rows="3"
                  class="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300"
                ></textarea>
              </div>
            </div>

            <!-- Step 2: Contact -->
            <div v-else-if="currentStep === 2" key="step2" class="space-y-6">
               <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Number</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+63</span>
                  <input 
                    v-model="form.phone"
                    type="tel"
                    placeholder="912 345 6789"
                    class="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
                </div>
                <p class="text-[10px] text-slate-400 font-medium italic ml-1">*This will be used for official announcements and alerts.</p>
              </div>
            </div>

            <!-- Step 3: Detailed Identity -->
            <div v-else-if="currentStep === 3" key="step3" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Birthdate</label>
                  <input type="date" v-model="form.birthdate" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Age</label>
                  <input type="number" v-model="form.age" placeholder="20" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Height (cm)</label>
                  <input type="text" v-model="form.height" placeholder="170 cm" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Weight (kg)</label>
                  <input type="text" v-model="form.weight" placeholder="60 kg" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Religion</label>
                <select v-model="form.religion" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none appearance-none">
                  <option value="" disabled>Select Religion</option>
                  <option v-for="r in religions" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nationality</label>
                <select v-model="form.nationality" class="w-full bg-white border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold focus:border-primary transition-all outline-none appearance-none">
                  <option v-for="n in nationalities" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
          </transition>
        </main>

        <!-- Footer Buttons -->
        <footer class="mt-12 flex items-center justify-between gap-4">
          <button 
            @click="prevStep"
            v-if="currentStep > 1"
            class="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft :size="16" /> Back
          </button>
          <div v-else></div>

          <button 
            @click="currentStep === 3 ? handleSubmit() : nextStep()"
            :disabled="!isStepValid || isSubmitting"
            class="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:translate-y-0 active:scale-95 transition-all"
          >
            <template v-if="isSubmitting">
              <Loader2 class="animate-spin" :size="18" /> Processing
            </template>
            <template v-else-if="currentStep === 3">
              Ready to Start <CheckCircle2 :size="18" />
            </template>
            <template v-else>
              Continue <ArrowRight :size="18" />
            </template>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
