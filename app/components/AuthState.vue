<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const status = computed(() => loggedIn.value ? 'authenticated' : 'unauthenticated')
</script>

<template>
  <div>
    <template v-if="status === 'authenticated'">
      <slot
        :logged-in="loggedIn"
        :user="user"
      >
        <!-- Default authenticated content -->
        <div>Logged in as {{ user?.email }}</div>
      </slot>
    </template>

    <template v-else-if="status === 'unauthenticated'">
      <slot
        :logged-in="false"
        :user="null"
      >
        <!-- Default unauthenticated content -->
        <div>Not logged in</div>
      </slot>
    </template>

    <template v-else>
      <slot name="placeholder">
        <!-- Default loading content -->
        <div>Loading...</div>
      </slot>
    </template>
  </div>
</template>
