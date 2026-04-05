<script setup>
import { Calendar, Clock, MapPin, User, ArrowLeft, Download, Bookmark } from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { onMounted } from 'vue';

const store = usePortalStore();

onMounted(() => {
  store.fetchMySubjects();
});

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const times = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <router-link to="/" class="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all card-shadow">
          <ArrowLeft class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Class Schedule</h1>
          <p class="text-sm text-gray-500 italic">"Management of time is the management of success."</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button class="px-4 py-2 border border-gray-100 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all card-shadow">
          <Download class="w-4 h-4 mr-2 inline" />
          Download PDF
        </button>
      </div>
    </div>

    <!-- Active Schedule Cards -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article 
        v-for="item in store.schedule" 
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] border border-gray-100 card-shadow relative overflow-hidden group hover:scale-[1.02] transition-all"
      >
        <div class="absolute inset-0 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" :class="item.color"></div>
        <div class="flex items-start justify-between mb-6 relative z-10">
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg', item.iconColor]">
            <Calendar class="w-8 h-8" />
          </div>
          <Bookmark class="w-5 h-5 text-gray-200 group-hover:text-primary transition-colors" />
        </div>
        
        <div class="relative z-10 space-y-4">
          <div>
            <h3 class="text-lg font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">{{ item.name }}</h3>
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Section: CS3A</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" />
              <div class="min-w-0">
                <p class="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Days</p>
                <p class="text-xs font-bold text-gray-700 truncate">{{ item.days || 'TBA' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-purple-500" />
              <div class="min-w-0">
                <p class="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Time</p>
                <p class="text-xs font-bold text-gray-700 truncate">{{ item.time }}</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 pt-2">
            <div class="flex items-center gap-2">
              <MapPin class="w-4 h-4 text-accent" />
              <div class="min-w-0">
                <p class="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Location</p>
                <p class="text-xs font-bold text-gray-700">{{ item.room }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-3 pt-2">
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
               <User class="w-4 h-4" />
            </div>
            <p class="text-sm font-medium text-gray-600">{{ item.instructor }}</p>
          </div>
        </div>
      </article>
    </section>

    <!-- Visual Weekly Matrix (Partial View) -->
    <section class="bg-white rounded-[2.5rem] border border-gray-100 card-shadow overflow-hidden hidden xl:block">
      <div class="p-6 border-b border-gray-50 bg-gray-50/20 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-gray-800">Weekly Planner View</h3>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A.Y. 2026-2027 Schedule</p>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-center border-collapse">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-4 py-4 border-r border-gray-50"></th>
              <th v-for="day in days" :key="day" class="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-r border-gray-50 last:border-0">{{ day }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="time in times" :key="time" class="group">
              <td class="px-4 py-6 border-r border-gray-50 text-[10px] font-bold text-gray-400 bg-gray-50/30">{{ time }}</td>
              <td v-for="day in days" :key="day" class="px-4 py-6 border-r border-gray-50 last:border-0 relative group-hover:bg-gray-50/50 transition-colors">
                <!-- Sample cell data logic -->
                <div v-if="day === 'Monday' && time === '09:00 AM'" class="absolute inset-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center p-1">
                  <span class="text-[8px] font-black text-primary leading-tight">SOFT ENG (302)</span>
                </div>
                <div v-if="day === 'Wednesday' && time === '01:00 PM'" class="absolute inset-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center p-1">
                  <span class="text-[8px] font-black text-accent leading-tight">WEB DEV (L1)</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
