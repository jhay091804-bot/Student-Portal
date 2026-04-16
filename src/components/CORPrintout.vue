<script setup>
import { computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';

const store = usePortalStore();
const { user, schedule } = store;

const printDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

const totalUnits = computed(() => {
  return schedule.reduce((acc, curr) => acc + (curr.units || 3), 0);
});
</script>

<template>
  <div class="print-container hidden print:block">
    <div class="cor-document font-serif p-10 bg-white min-h-screen text-black relative">
      <!-- Watermark Logo -->
      <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <img src="/chcci-logo.png" class="w-[500px]" />
      </div>

      <!-- Header -->
      <header class="flex items-center justify-between border-b-2 border-black pb-6 mb-8 relative z-10">
        <img src="/chcci-logo.png" class="w-24 h-24 object-contain" />
        <div class="text-center flex-1 mx-4">
          <h1 class="text-2xl font-bold uppercase tracking-tight">Concepcion Holy Cross College Inc.</h1>
          <p class="text-sm">Brgy. Minane, Concepcion, Tarlac, Philippines</p>
          <p class="text-xs italic mt-1 font-sans">"Academic Excellence & Values Formation"</p>
        </div>
        <div class="w-24 h-24 border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-300 font-sans uppercase">
          Student ID Card Area
        </div>
      </header>

      <!-- Document Title -->
      <div class="text-center mb-10 relative z-10">
        <h2 class="text-3xl font-black uppercase underline decoration-double decoration-2 underline-offset-8">Certificate of Registration</h2>
        <p class="text-lg font-bold mt-4 uppercase">First Semester, A.Y. 2026-2027</p>
      </div>

      <!-- Student Info Grid -->
      <div class="grid grid-cols-2 gap-y-6 gap-x-12 mb-10 text-sm border-2 border-black/10 p-6 rounded-lg relative z-10">
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-gray-500 uppercase font-sans">Student Name</p>
          <p class="text-lg font-black uppercase">{{ user?.name }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-gray-500 uppercase font-sans">Student ID / Number</p>
          <p class="text-lg font-black uppercase">{{ user?.id }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-gray-500 uppercase font-sans">Academic Program</p>
          <p class="font-bold uppercase">{{ user?.program }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-gray-500 uppercase font-sans">Year Level</p>
          <p class="font-bold uppercase">{{ user?.year }}</p>
        </div>
      </div>

      <!-- Subjects Table -->
      <div class="mb-10 relative z-10">
        <h3 class="text-sm font-black uppercase mb-4 font-sans tracking-widest border-b border-black w-fit">Enrolled Load</h3>
        <table class="w-full text-left border-collapse table-fixed">
          <thead>
            <tr class="border-y-2 border-black bg-slate-50 text-[10px] font-black uppercase font-sans">
              <th class="py-3 px-2 w-24">Code</th>
              <th class="py-3 px-2">Subject Description</th>
              <th class="py-3 px-2 w-32 text-center">Schedule</th>
              <th class="py-3 px-2 w-16 text-center">Room</th>
              <th class="py-3 px-2 w-12 text-center">Units</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/10">
            <tr v-for="item in schedule" :key="item.id" class="text-xs font-medium">
              <td class="py-4 px-2 font-black font-sans uppercase">{{ item.id }}</td>
              <td class="py-4 px-2 leading-tight uppercase">{{ item.name }}</td>
              <td class="py-4 px-2 text-[10px] text-center uppercase">{{ item.days }} <br/> {{ item.time }}</td>
              <td class="py-4 px-2 text-center font-bold">{{ item.room }}</td>
              <td class="py-4 px-2 text-center font-black">{{ item.units || 3 }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-black font-black uppercase text-sm">
              <td colspan="4" class="py-4 text-right pr-4">Total Academic Units:</td>
              <td class="py-4 text-center">{{ totalUnits }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Financial / Status -->
      <div class="mb-20 text-[10px] font-bold text-gray-500 uppercase font-sans grid grid-cols-2 gap-20 relative z-10">
        <div class="p-4 border border-dashed border-gray-300 rounded-lg">
          <p class="mb-2">Assessment Summary</p>
          <div class="flex justify-between text-black font-black text-xs">
            <span>Current Balance:</span>
            <span>{{ store.formattedBalance }}</span>
          </div>
          <p class="mt-4 text-[9px] lowercase font-normal italic">* this document serves as a temporary registration record while the official physical copy is processed.</p>
        </div>
        <div class="p-4 border border-dashed border-gray-300 rounded-lg flex flex-col justify-center items-center text-center">
          <p class="mb-1">Registration Status</p>
          <div class="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-black">FULLY ENROLLED</div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-2 gap-24 relative z-10">
        <div class="border-t-2 border-black pt-4 text-center">
          <p class="text-sm font-black uppercase underline">{{ user?.name }}</p>
          <p class="text-[9px] font-bold text-gray-400 mt-1 uppercase font-sans">Authorized Student Signature</p>
        </div>
        <div class="border-t-2 border-black pt-4 text-center">
          <p class="text-sm font-black uppercase italic">Electronic Signature - Valid</p>
          <p class="text-sm font-black uppercase">MS. MARISSA S. OCAMPO</p>
          <p class="text-[9px] font-bold text-gray-400 mt-1 uppercase font-sans">College Registrar / Dean</p>
        </div>
      </div>

      <!-- Document Footer -->
      <footer class="absolute bottom-10 left-10 right-10 flex justify-between items-end border-t border-gray-100 pt-10 text-[8px] font-bold text-gray-400 uppercase font-sans">
        <div>
          <p>Document Generated on: {{ printDate }}</p>
          <p>Verification Code: CHCCI-COR-{{ user?.id }}-2026W</p>
        </div>
        <div class="text-right">
          <p>Concepcion Holy Cross College - Student Portal v2.0</p>
          <p>© 2026 - Official Academic Document</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@page {
  size: A4;
  margin: 0;
}

@media print {
  .cor-document {
    width: 100%;
    height: 100%;
    margin: 0;
    -webkit-print-color-adjust: exact;
  }
}

.cor-document {
  max-width: 800px;
  margin: 0 auto;
}
</style>
