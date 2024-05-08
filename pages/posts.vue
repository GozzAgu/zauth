<script setup lang="ts">
import type { JwtPayload } from 'jsonwebtoken'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { logout, user, token } = useUserSession()

interface Post {
  payload: string | JwtPayload
}

const { data, error } = await useAPI<Post>('/api/posts')
</script>

<template>
  <div>
    Posts
    {{ token }}
    <div>
      {{ user }}
    </div>
    <div>
      {{ data }}
    </div>
    <div>
      {{ error }}
    </div>
  </div>
  <button fxc py1 w20 border @click="logout">
    Logout
  </button>
</template>
