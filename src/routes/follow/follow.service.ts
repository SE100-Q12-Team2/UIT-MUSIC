import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { AddFollowBodyType, GetFollowsQueryType } from 'src/routes/follow/follow.model'
import { FollowRepository } from 'src/routes/follow/follow.repo'

@Injectable()
export class FollowService {
  constructor(private readonly followRepository: FollowRepository) {}

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
   // Artist and RecordLabel validation here 
    return true
  }
}
