import { z } from 'zod'

export const ContactFormSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().max(20).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  agreePolicy: z.boolean(),
  status: z.enum(['Pending', 'InProgress', 'Resolved', 'Closed']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateContactFormSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email format'),
    phoneNumber: z.string().max(20).optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    agreePolicy: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the privacy policy',
    }),
  })
  .strict()

export const UpdateContactFormStatusSchema = z
  .object({
    status: z.enum(['Pending', 'InProgress', 'Resolved', 'Closed']),
  })
  .strict()

export const ContactFormResponseSchema = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  message: z.string(),
  status: z.enum(['Pending', 'InProgress', 'Resolved', 'Closed']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ContactFormType = z.infer<typeof ContactFormSchema>
export type CreateContactFormType = z.infer<typeof CreateContactFormSchema>
export type UpdateContactFormStatusType = z.infer<typeof UpdateContactFormStatusSchema>
export type ContactFormResponseType = z.infer<typeof ContactFormResponseSchema>
