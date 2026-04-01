<script setup>
import { FileText, ArrowLeft, Clock } from 'lucide-vue-next';
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div class="flex items-center gap-4">
      <router-link to="/" class="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-all card-shadow">
        <ArrowLeft class="w-5 h-5" />
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Prospectus</h1>
    </div>

    <div class="bg-white p-12 rounded-[2.5rem] border border-gray-100 card-shadow text-center space-y-4">
      <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
        <FileText class="w-10 h-10" />
      </div>
      <h2 class="text-xl font-bold text-gray-800">Section Under Maintenance</h2>
      <p class="text-gray-500 max-w-sm mx-auto">We are currently updating the curriculum records. Please check back later or visit the Registrar's Office.</p>
      <div class="flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 py-2 px-4 rounded-xl inline-block">
        <Clock class="w-4 h-4" />
        Estimated completion: 2 days
      </div>
    </div>
  </div>
</template>
