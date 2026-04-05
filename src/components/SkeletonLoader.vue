<script setup>
defineProps({
  type: { type: String, default: 'rect' }, // 'rect', 'circle', 'text'
  isLoading: { type: Boolean, default: true }
});
</script>

<template>
  <div 
    v-if="isLoading"
    class="skeleton-base"
    :class="[
      type === 'circle' ? 'rounded-full' : 'rounded-2xl',
      type === 'text' ? 'h-3 w-3/4' : 'w-full h-full'
    ]"
  ></div>
  <slot v-else></slot>
</template>

<style scoped>
.skeleton-base {
  background: #e2e8f0;
  background: linear-gradient(
    90deg,
    #f1f5f9 25%,
    #e2e8f0 50%,
    #f1f5f9 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
