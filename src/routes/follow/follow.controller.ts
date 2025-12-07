import { Body, Controller, Delete, Get, Param, Post, Query, HttpCode, HttpStatus, Logger, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddFollowBodyDTO,
  AddFollowResDTO,
  CheckFollowQueryDTO,
  CheckFollowResDTO,
  GetFollowersCountResDTO,
  GetFollowsQueryDTO,
  GetFollowsResponseDTO,
} from 'src/routes/follow/follow.dto'
import { FollowService } from 'src/routes/follow/follow.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Follows')
@Controller('follows')
@Auth([AuthType.None])
export class FollowController {
  private readonly logger = new Logger(FollowController.name)

  constructor(private readonly followService: FollowService) {}

  /**
   * GET /follows?userId=1&targetType=Artist&limit=20&page=1
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetFollowsResponseDTO)
  @ApiOperation({
    summary: 'Get user follows',
    description: 'Retrieve paginated list of artists or labels that a user is following. Supports filtering by target type and sorting options.',
  })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'User ID' })
  @ApiQuery({ name: 'targetType', required: false, enum: ['Artist', 'Label'], description: 'Filter by target type' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'Follows retrieved successfully', type: GetFollowsResponseDTO })
  getUserFollows(@Query() query: GetFollowsQueryDTO) {
    try {
      this.logger.log(`Get follows for user ${query.userId}, type: ${query.targetType || 'all'}`)
      const result = this.followService.getUserFollows(query)
      this.logger.log(`Retrieved follows for user ${query.userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get follows for user ${query.userId}`, error.stack)
      throw error
    }
  }

  /**
   * GET /follows/check?userId=1&targetType=Artist&targetId=123
   */
  @Get('check')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(CheckFollowResDTO)
  @ApiOperation({
    summary: 'Check if user follows target',
    description: 'Check whether a user is following a specific artist or label. Returns boolean indicating follow status.',
  })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'User ID' })
  @ApiQuery({ name: 'targetType', required: true, enum: ['Artist', 'Label'], description: 'Target type' })
  @ApiQuery({ name: 'targetId', required: true, type: Number, description: 'Target ID (artist or label)' })
  @ApiOkResponse({ description: 'Follow status retrieved', type: CheckFollowResDTO })
  checkFollow(@Query() query: CheckFollowQueryDTO) {
    try {
      this.logger.log(`Check follow for user ${query.userId}, ${query.targetType} ${query.targetId}`)
      const result = this.followService.checkFollow(Number(query.userId), query.targetType, Number(query.targetId))
      this.logger.log(`Follow status checked for user ${query.userId}, ${query.targetType} ${query.targetId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to check follow for user ${query.userId}`, error.stack)
      throw error
    }
  }

  /**
   * GET /follows/count/:targetType/:targetId
   */
  @Get('count/:targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetFollowersCountResDTO)
  @ApiOperation({
    summary: 'Get followers count',
    description: 'Get the total count of followers for a specific artist or label. Useful for displaying popularity metrics.',
  })
  @ApiParam({ name: 'targetType', enum: ['Artist', 'Label'], description: 'Target type' })
  @ApiParam({ name: 'targetId', type: Number, description: 'Target ID' })
  @ApiOkResponse({ description: 'Followers count retrieved', type: GetFollowersCountResDTO })
  getFollowersCount(@Param('targetType') targetType: string, @Param('targetId', ParseIntPipe) targetId: number) {
    try {
      this.logger.log(`Get followers count for ${targetType} ${targetId}`)
      const result = this.followService.getFollowersCount(targetType, targetId)
      this.logger.log(`Followers count retrieved for ${targetType} ${targetId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get followers count for ${targetType} ${targetId}`, error.stack)
      throw error
    }
  }

  /**
   * GET /follows/user/:userId/count
   */
  @Get('user/:userId/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user following count',
    description: 'Get total count of artists and labels that a user is following. Useful for user profile statistics.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Following count retrieved successfully' })
  getUserFollowingCount(@Param('userId', ParseIntPipe) userId: number) {
    try {
      this.logger.log(`Get following count for user ${userId}`)
      const result = this.followService.getUserFollowingCount(userId)
      this.logger.log(`Following count retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get following count for user ${userId}`, error.stack)
      throw error
    }
  }

  /**
   * GET /follows/user/:userId/ids?targetType=Artist
   */
  @Get('user/:userId/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user following IDs',
    description: 'Get array of IDs for artists or labels that user is following. Optionally filter by target type. Useful for batch operations.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiQuery({ name: 'targetType', required: false, enum: ['Artist', 'Label'], description: 'Filter by target type' })
  @ApiOkResponse({ description: 'Following IDs retrieved successfully' })
  getUserFollowingIds(@Param('userId', ParseIntPipe) userId: number, @Query('targetType') targetType?: string) {
    try {
      this.logger.log(`Get following IDs for user ${userId}, type: ${targetType || 'all'}`)
      const result = this.followService.getUserFollowingIds(userId, targetType)
      this.logger.log(`Following IDs retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get following IDs for user ${userId}`, error.stack)
      throw error
    }
  }

  /**
   * Follow an artist or label
   * POST /follows
   * Body: { userId: 1, targetType: "Artist", targetId: 123 }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(AddFollowResDTO)
  @ApiOperation({
    summary: 'Follow artist or label',
    description: 'Follow an artist or record label to receive updates and see their content. Creates a new follow relationship.',
  })
  @ApiBody({ type: AddFollowBodyDTO, description: 'Follow data including user ID, target type, and target ID' })
  @ApiCreatedResponse({ description: 'Follow created successfully', type: AddFollowResDTO })
  @ApiBadRequestResponse({ description: 'Invalid data or already following' })
  addFollow(@Body() body: AddFollowBodyDTO) {
    try {
      this.logger.log(`Add follow: user ${body.userId} follows ${body.targetType} ${body.targetId}`)
      const result = this.followService.addFollow(body)
      this.logger.log(`Follow added: user ${body.userId} follows ${body.targetType} ${body.targetId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to add follow: user ${body.userId}`, error.stack)
      throw error
    }
  }

  @Delete(':userId/:targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Unfollow artist or label',
    description: 'Remove a follow relationship for an artist or label. User will no longer receive updates from the unfollowed entity.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiParam({ name: 'targetType', enum: ['Artist', 'Label'], description: 'Target type' })
  @ApiParam({ name: 'targetId', type: Number, description: 'Target ID to unfollow' })
  @ApiOkResponse({ description: 'Unfollowed successfully', type: MessageResDTO })
  @ApiNotFoundResponse({ description: 'Follow relationship not found' })
  removeFollow(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('targetType') targetType: string,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    try {
      this.logger.log(`Remove follow: user ${userId} unfollows ${targetType} ${targetId}`)
      const result = this.followService.removeFollow(userId, targetType, targetId)
      this.logger.log(`Follow removed: user ${userId} unfollows ${targetType} ${targetId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to remove follow: user ${userId}`, error.stack)
      throw error
    }
  }
}
