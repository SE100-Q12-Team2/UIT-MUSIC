import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { AddFollowBodyType, GetFollowsQueryType } from 'src/routes/follow/follow.model'
import { FollowRepository } from 'src/routes/follow/follow.repo'
import { SharedUserRepository } from 'src/shared/repository/shared-user.repo'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly sharedUserRepo: SharedUserRepository,
  ) {}

  async getUserFollows(query: GetFollowsQueryType) {
    return await this.followRepository.findAll(query)
  }

  async checkFollow(userId: number, targetType: string, targetId: number) {
    if (!['Artist', 'Label'].includes(targetType)) {
      throw new BadRequestException('targetType must be either "Artist" or "Label"')
    }

    return await this.followRepository.checkFollow(userId, targetType, targetId)
  }

  async addFollow(body: AddFollowBodyType) {
    const existingUser = await this.sharedUserRepo.findUnique({
      id: body.userId,
    })

      if (!existingUser) {
      throw new NotFoundException(`User with ID ${body.userId} not found`)
    }

    const existing = await this.followRepository.findByUserAndTarget(body.userId, body.targetType, body.targetId)

    if (existing) {
      throw new ConflictException('Already following this target')
    }

    await this.verifyTargetExists(body.targetType, body.targetId)

    return await this.followRepository.add(body)
  }

  async removeFollow(userId: number, targetType: string, targetId: number) {
    if (!['Artist', 'Label'].includes(targetType)) {
      throw new BadRequestException('targetType must be either "Artist" or "Label"')
    }
    const follow = await this.followRepository.findByUserAndTarget(userId, targetType, targetId)

    if (!follow) {
      throw new NotFoundException('Follow not found')
    }

    return await this.followRepository.remove(userId, targetType, targetId)
  }

  async getFollowersCount(targetType: string, targetId: number) {
    if (!['Artist', 'Label'].includes(targetType)) {
      throw new BadRequestException('targetType must be either "Artist" or "Label"')
    }

    return await this.followRepository.countFollowersByTarget(targetType, targetId)
  }

  async getUserFollowingCount(userId: number) {
    const count = await this.followRepository.countFollowsByUser(userId)
    return {
      userId,
      totalFollowing: count,
    }
  }

  async getUserFollowingIds(userId: number, targetType?: string) {
    if (targetType && !['Artist', 'Label'].includes(targetType)) {
      throw new BadRequestException('targetType must be either "Artist" or "Label"')
    }

    const ids = await this.followRepository.getUserFollowingIds(userId, targetType)
    return {
      userId,
      targetType: targetType || 'All',
      followingIds: ids,
    }
  }

  private async verifyTargetExists(targetType: string, targetId: number) {
    // if (targetType === 'Artist') {
    //   const artist = await this.prisma.artist.findUnique({
    //     where: { id: targetId },
    //   })

    //   if (!artist) {
    //     throw new NotFoundException(`Artist with ID ${targetId} not found`)
    //   }

    //   if (!artist.hasPublicProfile) {
    //     throw new BadRequestException(`Artist with ID ${targetId} does not have a public profile`)
    //   }
    // } else if (targetType === 'Label') {
    //   const label = await this.prisma.recordLabel.findUnique({
    //     where: { id: targetId },
    //   })

    //   if (!label) {
    //     throw new NotFoundException(`Record Label with ID ${targetId} not found`)
    //   }

    //   if (!label.hasPublicProfile) {
    //     throw new BadRequestException(`Record Label with ID ${targetId} does not have a public profile`)
    //   }
    // }

    return true
  }
}
