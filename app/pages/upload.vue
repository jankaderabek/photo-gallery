<script setup lang="ts">
const upload = useUpload('/api/images/upload', { method: 'PUT' })

async function onFileSelect({ target }: Event) {
  const uploadedFiles = await upload(target as HTMLInputElement)
}
</script>

<template>
  <input
      accept="image/jpeg, image/png"
      type="file"
      name="file"
      multiple
      @change="onFileSelect"
  >
</template>
