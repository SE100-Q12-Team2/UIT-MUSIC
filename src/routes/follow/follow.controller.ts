import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
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

@Controller('follows')
@Auth([AuthType.None])
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /**
   * GET /follows?userId=1&targetType=Artist&limit=20&page=1
   */
  @Get()
  @ZodSerializerDto(GetFollowsResponseDTO)
  getUserFollows(@Query() query: GetFollowsQueryDTO) {
    return this.followService.getUserFollows(query)
  }

  /**
   * GET /follows/check?userId=1&targetType=Artist&targetId=123
   */
  @Get('check')
  @ZodSerializerDto(CheckFollowResDTO)
  checkFollow(@Query() query: CheckFollowQueryDTO) {
    return this.followService.checkFollow(Number(query.userId), query.targetType, Number(query.targetId))
  }

  /**
   * GET /follows/count/:targetType/:targetId
   */
  @Get('count/:targetType/:targetId')
  @ZodSerializerDto(GetFollowersCountResDTO)
  getFollowersCount(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.followService.getFollowersCount(targetType, Number(targetId))
  }

  /**
   * GET /follows/user/:userId/count
   */
  @Get('user/:userId/count')
  getUserFollowingCount(@Param('userId') userId: string) {
    return this.followService.getUserFollowingCount(Number(userId))
  }

  /**
   * GET /follows/user/:userId/ids?targetType=Artist
   */
  @Get('user/:userId/ids')
  getUserFollowingIds(@Param('userId') userId: string, @Query('targetType') targetType?: string) {
    return this.followService.getUserFollowingIds(Number(userId), targetType)
  }

  /**
   * Follow an artist or label
   * POST /follows
   * Body: { userId: 1, targetType: "Artist", targetId: 123 }
   */
  @Post()
  @ZodSerializerDto(AddFollowResDTO)
  addFollow(@Body() body: AddFollowBodyDTO) {
    return this.followService.addFollow(body)
  }

  @Delete(':userId/:targetType/:targetId')
  @ZodSerializerDto(MessageResDTO)
  removeFollow(
    @Param('userId') userId: string,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.followService.removeFollow(Number(userId), targetType, Number(targetId))
  }
}
