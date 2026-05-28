<script setup lang="ts">
defineProps<{
  permission: NotificationPermission;
}>();

const emit = defineEmits<{
  requestPermission: [];
}>();
</script>

<template>
  <v-alert
    v-if="permission === 'denied'"
    type="warning"
    variant="tonal"
    class="permission-banner"
  >
    Reminders are blocked. To re-enable, open your browser's site settings and
    allow notifications for this site.
  </v-alert>

  <v-alert
    v-else-if="permission === 'default'"
    type="info"
    variant="tonal"
    class="permission-banner"
  >
    <div class="permission-banner__content">
      <span>Enable notifications to receive eye exercise reminders even when this app is closed.</span>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        @click="emit('requestPermission')"
      >
        Enable reminders
      </v-btn>
    </div>
  </v-alert>
</template>

<style scoped>
.permission-banner {
  font-size: 14px;
}

.permission-banner__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
</style>
