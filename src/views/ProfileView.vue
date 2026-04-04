<script setup>
import { User, Mail, Phone, MapPin, Edit3, Save, Camera, GraduationCap, Calendar, ShieldCheck } from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { ref, reactive } from 'vue';

const store = usePortalStore();
const isEditing = ref(false);

const profileForm = reactive({ ...store.user });

const saveProfile = async () => {
  const result = await store.updateProfile(profileForm);
  if (result.success) {
    isEditing.value = false;
  } else {
    alert(result.message);
  }
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Student Profile</h1>
      <button 
        @click="isEditing ? saveProfile() : (isEditing = true)"
        :class="[
          'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95',
          isEditing ? 'bg-primary text-white shadow-primary/30' : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'
        ]"
      >
        <component :is="isEditing ? Save : Edit3" class="w-4 h-4" />
        {{ isEditing ? 'Save Changes' : 'Edit Profile' }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <!-- Avatar Section -->
      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-[2.5rem] border border-gray-100 card-shadow text-center relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-1/2"></div>
          
          <div class="relative w-32 h-32 mx-auto mb-6">
            <img :src="profileForm.avatar" class="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" alt="Profile" />
            <button v-if="isEditing" class="absolute bottom-1 right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform">
              <Camera class="w-4 h-4" />
            </button>
          </div>
          
          <h2 class="text-xl font-black text-gray-900">{{ store.user.name }}</h2>
          <p class="text-xs font-bold text-primary uppercase tracking-widest mt-1">ID: {{ store.user.id }}</p>
          
          <div class="mt-8 pt-8 border-t border-gray-50 space-y-4">
            <div class="flex items-center justify-between text-left">
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Year Level</p>
                <p class="text-sm font-bold text-gray-700">{{ store.user.year }}</p>
              </div>
              <div class="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <GraduationCap class="w-4 h-4" />
              </div>
            </div>
            <div class="flex items-center justify-between text-left">
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrolled Status</p>
                <p class="text-sm font-bold text-green-600">FULLY ENROLLED</p>
              </div>
              <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                <ShieldCheck class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Details Section -->
      <main class="lg:col-span-3 space-y-6">
        <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 card-shadow space-y-8">
          
          <!-- Personal Information -->
          <section>
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User class="w-4 h-4 text-primary" />
              Personal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                <input 
                  v-model="profileForm.name"
                  :disabled="!isEditing"
                  class="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Program</label>
                <input 
                  v-model="profileForm.program"
                  disabled
                  class="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <hr class="border-gray-50" />

          <!-- Contact Details -->
          <section>
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Mail class="w-4 h-4 text-primary" />
              Contact Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail class="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    v-model="profileForm.email"
                    disabled
                    class="w-full bg-gray-50 border border-gray-100 rounded-xl px-10 py-3 text-sm font-bold text-gray-700 opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone class="w-4 h-4" />
                  </span>
                  <input 
                    type="tel"
                    v-model="profileForm.phone"
                    placeholder="+63 XXX XXX XXXX"
                    :disabled="!isEditing"
                    class="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-10 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
                  />
                </div>
              </div>
              <div class="space-y-2 md:col-span-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Residential Address</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <MapPin class="w-4 h-4" />
                  </span>
                  <input 
                    v-model="profileForm.address"
                    placeholder="Enter your residential address"
                    :disabled="!isEditing"
                    class="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-10 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          </section>

          <footer class="pt-8">
            <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-start gap-4">
              <Calendar class="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <h4 class="text-sm font-black text-gray-800">Enrollment Summary</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                  You are currently enrolled for the First Semester of Academic Year 2026-2027. Your program of study is 
                  <strong>Bachelor of Science in Computer Science</strong>. All academic records are maintained by the Office of the Registrar.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>
