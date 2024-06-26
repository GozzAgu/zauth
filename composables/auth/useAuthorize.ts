import type { LocationQuery } from 'vue-router'

export default async function (param: LocationQuery) {
  const { data, status, execute, error } = await useFetch(
    '/api/auth/callback/microsoft',
    { query: param, immediate: false },
  )

  onNuxtReady(async () => {
    param.code && await execute()

    if (data.value && status.value === 'success' && !error.value) {
      setToken(data.value.accessToken)
      setUser(data.value.user)
      navigateTo('/posts')
    }
  })

  return { status }
}
