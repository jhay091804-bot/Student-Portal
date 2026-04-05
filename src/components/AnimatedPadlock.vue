<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String, // 'idle', 'loading', 'success', 'error'
    default: 'idle'
  },
  size: {
    type: Number,
    default: 24
  }
});

const strokeColor = computed(() => {
  if (props.status === 'success') return '#10b981'; // green-500
  if (props.status === 'error') return '#ef4444';   // red-500
  return 'currentColor';
});
</script>

<template>
  <div :style="{ width: size + 'px', height: size + 'px' }" class="relative flex items-center justify-center">
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2.5" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      class="transition-all duration-500 ease-out"
      :class="{
        'animate-bounce': status === 'loading',
        'scale-110': status === 'success'
      }"
    >
      <!-- Padlock Body -->
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      
      <!-- Padlock Shackle -->
      <path 
        d="M7 11V7a5 5 0 0 1 10 0v4" 
        class="shackle-transition"
        :class="{ 'shackle-open': status === 'success' }"
      />
      
      <!-- Success Checkmark (hidden usually) -->
      <path 
        v-if="status === 'success'"
        d="M9 17l2 2 4-4" 
        class="checkmark-draw"
      />
      <!-- Keyhole -->
      <circle v-else cx="12" cy="16" r="1.5" />
    </svg>
  </div>
</template>

<style scoped>
.shackle-transition {
  transition: d 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: 12px 11px;
}

.shackle-open {
  transform: translateY(-3px) rotate(15deg);
}

.checkmark-draw {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: draw 0.4s forwards 0.2s;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-bounce {
  animation: bounce 0.6s infinite ease-in-out;
}
</style>
