<script setup>
import { CheckSquare, ArrowLeft, Clock } from 'lucide-vue-next';
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div class="flex items-center gap-4">
      <router-link to="/" class="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-all card-shadow">
        <ArrowLeft class="w-5 h-5" />
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">E-Clearance</h1>
    </div>

    <div class="bg-white p-12 rounded-[2.5rem] border border-gray-100 card-shadow text-center space-y-4">
      <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
        <CheckSquare class="w-10 h-10" />
      </div>
      <h2 class="text-xl font-bold text-gray-800">No Pending Clearances</h2>
      <p class="text-gray-500 max-w-sm mx-auto">Your academic and financial clearances for the current semester are fully settled.</p>
    </div>
  </div>
</template>
