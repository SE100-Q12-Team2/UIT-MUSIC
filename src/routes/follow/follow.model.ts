import z from 'zod'

export const FollowTypeEnum = z.enum(['Artist', 'Label'])

export const FollowSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  targetType: FollowTypeEnum,
  targetId: z.number().int().positive(),
  followedAt: z.string(),
})

export const FollowArtistInfoSchema = z.object({
  id: z.number().int().positive(),
  artistName: z.string(),
  biography: z.string().nullable(),
  profileImage: z.string().nullable(),
  hasPublicProfile: z.boolean(),
})

export const FollowLabelInfoSchema = z.object({
  id: z.number().int().positive(),
  labelName: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  hasPublicProfile: z.boolean(),
})

export const GetFollowsQuerySchema = z.object({
  userId: z.string().optional(),
  targetType: z.enum(['Artist', 'Label']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  page: z.number().int().min(1).default(1),
  sort: z.enum(['followedAt', 'name']).default('followedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const FollowWithTargetSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  targetType: FollowTypeEnum,
  targetId: z.number().int().positive(),
  followedAt: z.string(),
  target: z.union([FollowArtistInfoSchema, FollowLabelInfoSchema]).nullable(),
})

export const GetFollowsResponseSchema = z.object({
  data: z.array(FollowWithTargetSchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  limit: z.number().int(),
})

export const AddFollowBodySchema = z.object({
  userId: z.number().int().positive(),
  targetType: FollowTypeEnum,
  targetId: z.number().int().positive(),
})

export const AddFollowResSchema = FollowSchema

export const CheckFollowQuerySchema = z.object({
  userId: z.string(),
  targetType: z.enum(['Artist', 'Label']),
  targetId: z.string(),
})

export const CheckFollowResSchema = z.object({
  isFollowing: z.boolean(),
  followedAt: z.string().nullable(),
})

export const GetFollowersCountResSchema = z.object({
  targetType: FollowTypeEnum,
  targetId: z.number().int().positive(),
  followersCount: z.number().int(),
})

export type FollowType = z.infer<typeof FollowSchema>
export type FollowTypeEnumType = z.infer<typeof FollowTypeEnum>
export type FollowArtistInfoType = z.infer<typeof FollowArtistInfoSchema>
export type FollowLabelInfoType = z.infer<typeof FollowLabelInfoSchema>
export type FollowWithTargetType = z.infer<typeof FollowWithTargetSchema>

export type GetFollowsQueryType = z.infer<typeof GetFollowsQuerySchema>
export type GetFollowsResponseType = z.infer<typeof GetFollowsResponseSchema>

export type AddFollowBodyType = z.infer<typeof AddFollowBodySchema>
export type AddFollowResType = z.infer<typeof AddFollowResSchema>

export type CheckFollowQueryType = z.infer<typeof CheckFollowQuerySchema>
export type CheckFollowResType = z.infer<typeof CheckFollowResSchema>

export type GetFollowersCountResType = z.infer<typeof GetFollowersCountResSchema>
