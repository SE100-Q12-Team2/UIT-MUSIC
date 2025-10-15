import { z } from 'zod'

export const CreateResetTokenBodySchema = z.object({
  userId: z.number(),
  token: z.string(),
  expiresAt: z.date(),
})

export type CreateResetTokenBodyType = z.infer<typeof CreateResetTokenBodySchema>
