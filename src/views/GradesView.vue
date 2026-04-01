<script setup>
import { GraduationCap, ArrowLeft, Search, Filter, Download } from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { ref, computed, onMounted } from 'vue';

const store = usePortalStore();
const searchQuery = ref('');

onMounted(() => {
  store.fetchMySubjects();
});

const filteredGrades = computed(() => {
  return store.grades.filter(g => 
    g.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    g.code.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <router-link to="/" class="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all card-shadow">
          <ArrowLeft class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Academic Grades</h1>
          <p class="text-sm text-gray-500">Academic Year 2026-2027 | First Semester</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all card-shadow">
          <Download class="w-4 h-4" />
          Export PDF
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-primary p-6 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
        <p class="text-xs uppercase font-bold text-white/60 tracking-widest">General Weighted Average</p>
        <h2 class="text-4xl font-black mt-1">{{ store.user.avg }}</h2>
        <GraduationCap class="absolute -right-4 -bottom-4 w-20 h-20 opacity-10 group-hover:scale-110 transition-transform" />
      </div>
      <div class="bg-white p-6 rounded-3xl border border-gray-100 card-shadow">
        <p class="text-xs uppercase font-bold text-gray-400 tracking-widest">Total Units</p>
        <h2 class="text-4xl font-black text-gray-800 mt-1">{{ store.totalUnits }}</h2>
      </div>
      <div class="bg-white p-6 rounded-3xl border border-gray-100 card-shadow">
        <p class="text-xs uppercase font-bold text-gray-400 tracking-widest">Subjects Taken</p>
        <h2 class="text-4xl font-black text-gray-800 mt-1">{{ store.grades.length }}</h2>
      </div>
    </div>

    <!-- Grades Table Section -->
    <div class="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden">
      <!-- Table Controls -->
      <div class="p-4 border-b border-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/30">
        <div class="relative w-full sm:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search class="w-4 h-4" />
          </span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search subject..." 
            class="w-full bg-white border border-gray-200 text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
          />
        </div>
        <div class="flex items-center gap-2">
          <button class="p-2 text-gray-400 hover:text-primary transition-colors">
            <Filter class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Table Wrapper -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
              <th class="px-6 py-4">Subject Code</th>
              <th class="px-6 py-4">Subject Name</th>
              <th class="px-6 py-4">Units</th>
              <th class="px-6 py-4 text-center">Grade</th>
              <th class="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="grade in filteredGrades" :key="grade.code" class="hover:bg-gray-50/80 transition-colors group">
              <td class="px-6 py-4 font-bold text-primary text-sm">{{ grade.code }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-700">{{ grade.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ grade.units }}</td>
              <td class="px-6 py-4 text-center">
                <span class="inline-block px-3 py-1 bg-primary/5 text-primary rounded-lg font-bold text-sm">
                  {{ grade.grade }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                  <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  {{ grade.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredGrades.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">No matching subjects found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
