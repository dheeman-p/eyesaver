<script setup lang="ts">
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <v-alert
    v-if="show"
    type="info"
    variant="tonal"
    class="sync-notice"
  >
    Background reminders are not supported in this browser — keep a tab open for reminders.
  </v-alert>
</template>

<style scoped>
.sync-notice {
  font-size: 14px;
}
</style>
