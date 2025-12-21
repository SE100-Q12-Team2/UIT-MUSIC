import { Injectable } from '@nestjs/common'
import { FollowType, Prisma } from '@prisma/client'
import {
  AddFollowBodyType,
  CheckFollowResType,
  GetFollowersCountResType,
  GetFollowsQueryType,
  GetFollowsResponseType,
} from 'src/routes/follow/follow.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFollowsQueryType): Promise<GetFollowsResponseType> {
    const limit = Math.min(query.limit ?? 20, 100)
    const skip = ((query.page ?? 1) - 1) * limit

    const where: Prisma.FollowWhereInput = {}

    if (query.userId) {
      where.userId = Number(query.userId)
    }

    if (query.targetType) {
      where.targetType = query.targetType as FollowType
    }

    let orderBy: Prisma.FollowOrderByWithRelationInput = {}

    if (query.sort === 'followedAt') {
      orderBy = { followedAt: query.order }
    }

    const [follows, totalItems] = await this.prisma.$transaction([
      this.prisma.follow.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      this.prisma.follow.count({ where }),
    ])

    const followsWithTargets = await Promise.all(
      follows.map(async (follow) => {
        let target: any = null

        if (follow.targetType === 'Artist') {
          target = await this.prisma.recordLabel.findUnique({
            where: { id: follow.targetId },
            select: {
              id: true,
              labelName: true,
              imageUrl: true,
              description: true,
              website: true,              
              hasPublicProfile: true,
            },
          })
        } else if (follow.targetType === 'Label') {
          target = await this.prisma.recordLabel.findUnique({
            where: { id: follow.targetId },
            select: {
              id: true,
              labelName: true,
              description: true,
              website: true,
              hasPublicProfile: true,
            },
          })
        }

        return {
          ...follow,
          target,
        }
      }),
    )

    return {
      data: followsWithTargets as any,
      page: query.page ?? 1,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      limit,
    }
  }

  async findByUserAndTarget(userId: number, targetType: string, targetId: number) {
    return await this.prisma.follow.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: userId,
          targetType: targetType as FollowType,
          targetId: targetId,
        },
      },
    })
  }

  async checkFollow(userId: number, targetType: string, targetId: number): Promise<CheckFollowResType> {
    const follow = await this.findByUserAndTarget(userId, targetType, targetId)

    return {
      isFollowing: !!follow,
      followedAt: follow?.followedAt ? follow.followedAt.toISOString() : null,
    }
  }

  async add(body: AddFollowBodyType) {
    return await this.prisma.follow.create({
      data: {
        userId: body.userId,
        targetType: body.targetType as FollowType,
        targetId: body.targetId,
      },
    })
  }

  async remove(userId: number, targetType: string, targetId: number) {
    await this.prisma.follow.delete({
      where: {
        userId_targetType_targetId: {
          userId: userId,
          targetType: targetType as FollowType,
          targetId: targetId,
        },
      },
    })

    return {
      message: 'Unfollowed successfully',
    }
  }

  async countFollowersByTarget(targetType: string, targetId: number): Promise<GetFollowersCountResType> {
    const count = await this.prisma.follow.count({
      where: {
        targetType: targetType as FollowType,
        targetId: targetId,
      },
    })

    return {
      targetType: targetType as any,
      targetId: targetId,
      followersCount: count,
    }
  }

  async countFollowsByUser(userId: number): Promise<number> {
    return await this.prisma.follow.count({
      where: {
        userId: userId,
      },
    })
  }

  async getUserFollowingIds(userId: number, targetType?: string): Promise<number[]> {
    const where: Prisma.FollowWhereInput = {
      userId: userId,
    }

    if (targetType) {
      where.targetType = targetType as FollowType
    }

    const follows = await this.prisma.follow.findMany({
      where,
      select: {
        targetId: true,
      },
    })

    return follows.map((follow) => follow.targetId)
  }
}
