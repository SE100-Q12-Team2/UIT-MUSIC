import { z } from 'zod'

export const LanguageEnum = z.enum(['Vietnamese', 'English'])

export const UserPreferenceSchema = z.object({
  userId: z.number().int().positive(),
  preferredGenres: z.array(z.number().int().positive()).nullable(),
  preferredLanguages: z.array(LanguageEnum).nullable(),
  explicitContent: z.boolean().default(false),
  autoPlay: z.boolean().default(true),
  highQualityStreaming: z.boolean().default(false),
  updatedAt: z.date(),
})

export const CreateUserPreferenceSchema = z
  .object({
    preferredGenres: z.array(z.number().int().positive()).optional(),
    preferredLanguages: z.array(LanguageEnum).optional(),
    explicitContent: z.boolean().default(false),
    autoPlay: z.boolean().default(true),
    highQualityStreaming: z.boolean().default(false),
  })
  .strict()

export const UpdateUserPreferenceSchema = z
  .object({
    preferredGenres: z.array(z.number().int().positive()).optional(),
    preferredLanguages: z.array(LanguageEnum).optional(),
    explicitContent: z.boolean().optional(),
    autoPlay: z.boolean().optional(),
    highQualityStreaming: z.boolean().optional(),
  })
  .strict()

export const UserPreferenceResponseSchema = z.object({
  userId: z.number(),
  preferredGenres: z.array(z.number()).nullable(),
  preferredLanguages: z.array(LanguageEnum).nullable(),
  explicitContent: z.boolean(),
  autoPlay: z.boolean(),
  highQualityStreaming: z.boolean(),
  updatedAt: z.date(),
})

export type LanguageType = z.infer<typeof LanguageEnum>
export type UserPreferenceType = z.infer<typeof UserPreferenceSchema>
export type CreateUserPreferenceType = z.infer<typeof CreateUserPreferenceSchema>
export type UpdateUserPreferenceType = z.infer<typeof UpdateUserPreferenceSchema>
export type UserPreferenceResponseType = z.infer<typeof UserPreferenceResponseSchema>
