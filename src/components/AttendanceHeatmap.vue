<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

// Generate days for the last 6 months
const days = computed(() => {
  const result = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 5);
  startDate.setDate(1);

  const current = new Date(startDate);
  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    const morning = props.data.find(d => d.date === dateStr);
    result.push({
      date: dateStr,
      status: morning ? morning.status : 'none',
      label: current.toLocaleDateString('default', { month: 'short', day: 'numeric' })
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
});

const getLevelClass = (status) => {
  switch (status) {
    case 'present': return 'bg-primary opacity-100 shadow-sm';
    case 'late': return 'bg-primary opacity-50';
    case 'absent': return 'bg-red-400 opacity-80';
    default: return 'bg-gray-100';
  }
};

const months = computed(() => {
  const result = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(today.getMonth() - i);
    result.push(d.toLocaleString('default', { month: 'short' }));
  }
  return result;
});
</script>

<template>
  <div class="bg-white p-6 rounded-[2rem] border border-gray-100 card-shadow overflow-hidden group">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Attendance Heatmap</h3>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Consistency over the last 6 months</p>
      </div>
      <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400">
        <span>Less</span>
        <div class="flex gap-1">
          <div class="w-2.5 h-2.5 rounded-sm bg-gray-100"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary opacity-30"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary opacity-60"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary opacity-100"></div>
        </div>
        <span>More</span>
      </div>
    </div>

    <!-- Heatmap Grid -->
    <div class="relative">
      <div class="flex gap-1 mb-2">
        <div v-for="month in months" :key="month" class="flex-1 text-[9px] font-black text-gray-300 uppercase tracking-tighter">
          {{ month }}
        </div>
      </div>
      
      <div class="flex flex-wrap gap-1 sm:gap-1.5 justify-start max-w-full overflow-hidden">
        <div 
          v-for="day in days" 
          :key="day.date"
          :class="['w-[calc(14.28%-0.25rem)] sm:w-4 sm:h-4 aspect-square rounded-sm transition-all hover:scale-125 cursor-help ring-primary/20 hover:ring-2', getLevelClass(day.status)]"
          :title="`${day.label}: ${day.status}`"
        ></div>
      </div>
    </div>

    <!-- Summary -->
    <div class="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
       <div class="flex items-center gap-4">
          <div>
             <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Streak</p>
             <p class="text-sm font-black text-gray-900">12 Days 🔥</p>
          </div>
          <div class="w-px h-8 bg-gray-100"></div>
          <div>
             <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consistency</p>
             <p class="text-sm font-black text-green-600">94.2%</p>
          </div>
       </div>
       <button class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all">Details</button>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the heatmap takes up full width but maintains square aspect for cells */
</style>
