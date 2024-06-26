import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { init } from '@paralleldrive/cuid2'

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'

export const roleEnum = pgEnum('role', ['regular', 'admin', 'manager'])
export const authTypeEnum = pgEnum('auth_type', ['microsoft', 'google', 'linkedin', 'email'])

const createUserId = init({ random: Math.random, length: 30, fingerprint: 'zauth-user-id' })
const createRefreshTokenId = init({ random: Math.random, length: 35, fingerprint: 'zauth-session-id' })
const createPostId = init({ random: Math.random, length: 25, fingerprint: 'zauth-post-id' })

export const users = pgTable('users', {
  id: text('id').$defaultFn(() => createUserId()).primaryKey(),
  email: text('email').notNull().unique(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  role: roleEnum('role').default('regular').notNull(),
  authType: authTypeEnum('auth_type').default('email').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
})

export const refreshTokens = pgTable('refresh_tokens', {
  tokenId: text('token_id').$defaultFn(() => createRefreshTokenId()).primaryKey(),
  expireAt: timestamp('expire_at', { mode: 'string' }).notNull().default(sql`now()`),
  userId: text('user_id').notNull().unique().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
})

export const posts = pgTable('posts', {
  id: text('id').$defaultFn(() => createPostId()).primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
})

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  post: many(posts),
}))

export const insertUserSchema = createInsertSchema(users)
export type InsertUser = z.infer<typeof insertUserSchema>

export const selectUserSchema = createSelectSchema(users)
export type User = z.infer<typeof selectUserSchema>

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens)
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>

export const selectRefreshTokenSchema = createSelectSchema(refreshTokens)
export type RefreshToken = z.infer<typeof selectRefreshTokenSchema>
