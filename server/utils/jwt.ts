import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import type { User } from '~/types'

export function generateAccessToken(
  event: H3Event,
  payload: User,
) {
  const config = useRuntimeConfig(event)

  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: '10m' })
}

export async function requireAccessToken(event: H3Event) {
  const config = useRuntimeConfig(event)
  const aToken = await parseHeaderAs(event, 'Authorization', z.string())
  try {
    return jwt.verify(aToken.split(' ')[1], config.jwt.accessSecret)
  }
  catch (error) {
    throw createErrorResponse(error, 401, 'Unauthorized Access!')
  }
}

// export type Payload = ReturnType<typeof decodeAccessToken>
