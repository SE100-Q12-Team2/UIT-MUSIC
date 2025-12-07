import { Body, Controller, Delete, Get, Param, Post, Query, HttpCode, HttpStatus, Logger, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddFavoriteBodyDTO,
  AddFavoriteResDTO,
  CheckFavoriteQueryDTO,
  CheckFavoriteResDTO,
  GetFavoritesQueryDTO,
  GetFavoritesResponseDTO,
} from 'src/routes/favorite/favorite.dto'
import { FavoriteService } from 'src/routes/favorite/favorite.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Favorites')
@Controller('favorites')
@Auth([AuthType.None])
export class FavoriteController {
  private readonly logger = new Logger(FavoriteController.name)

  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * GET /favorites?userId=1&limit=20&page=1&sort=likedAt&order=desc
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetFavoritesResponseDTO)
  @ApiOperation({
    summary: 'Get user favorites',
    description: 'Retrieve paginated list of favorite songs for a specific user with sorting and filtering options. Public endpoint accessible without authentication.',
  })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'User ID to get favorites for' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['likedAt'], description: 'Sort field' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiOkResponse({ description: 'Favorites retrieved successfully', type: GetFavoritesResponseDTO })
  getUserFavorites(@Query() query: GetFavoritesQueryDTO) {
    try {
      this.logger.log(`Get favorites for user ${query.userId}`)
      const result = this.favoriteService.getUserFavorites(query)
      this.logger.log(`Retrieved favorites for user ${query.userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get favorites for user ${query.userId}`, error.stack)
      throw error
    }
  }

  /**
   * GET /favorites/check?userId=1&songId=123
   */
  @Get('check')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(CheckFavoriteResDTO)
  @ApiOperation({
    summary: 'Check if song is favorited',
    description: 'Check whether a specific song is in user favorites. Returns boolean indicating favorite status.',
  })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'User ID' })
  @ApiQuery({ name: 'songId', required: true, type: Number, description: 'Song ID to check' })
  @ApiOkResponse({ description: 'Favorite status retrieved', type: CheckFavoriteResDTO })
  checkFavorite(@Query() query: CheckFavoriteQueryDTO) {
    try {
      this.logger.log(`Check favorite for user ${query.userId}, song ${query.songId}`)
      const result = this.favoriteService.checkFavorite(Number(query.userId), Number(query.songId))
      this.logger.log(`Favorite status checked for user ${query.userId}, song ${query.songId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to check favorite for user ${query.userId}, song ${query.songId}`, error.stack)
      throw error
    }
  }

  @Get('count/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user favorite count',
    description: 'Get the total count of favorite songs for a specific user. Useful for displaying user statistics.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Favorite count retrieved successfully' })
  getUserFavoriteCount(@Param('userId', ParseIntPipe) userId: number) {
    try {
      this.logger.log(`Get favorite count for user ${userId}`)
      const result = this.favoriteService.getUserFavoriteCount(userId)
      this.logger.log(`Favorite count retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get favorite count for user ${userId}`, error.stack)
      throw error
    }
  }

  @Get('songs/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user favorite song IDs',
    description: 'Get array of song IDs that are in user favorites. Useful for batch operations and quick lookups.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Favorite song IDs retrieved successfully' })
  getUserFavoriteSongIds(@Param('userId', ParseIntPipe) userId: number) {
    try {
      this.logger.log(`Get favorite song IDs for user ${userId}`)
      const result = this.favoriteService.getUserFavoriteSongIds(userId)
      this.logger.log(`Favorite song IDs retrieved for user ${userId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get favorite song IDs for user ${userId}`, error.stack)
      throw error
    }
  }

  @Post()
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(AddFavoriteResDTO)
  @ApiOperation({
    summary: 'Add song to favorites',
    description: 'Add a song to user favorites collection. Requires authentication. Creates a new favorite entry with timestamp.',
  })
  @ApiBody({ type: AddFavoriteBodyDTO, description: 'User and song IDs' })
  @ApiCreatedResponse({ description: 'Song added to favorites successfully', type: AddFavoriteResDTO })
  @ApiBadRequestResponse({ description: 'Invalid data or song already favorited' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  addFavorite(@Body() body: AddFavoriteBodyDTO) {
    try {
      this.logger.log(`Add favorite: user ${body.userId}, song ${body.songId}`)
      const result = this.favoriteService.addFavorite(body)
      this.logger.log(`Favorite added: user ${body.userId}, song ${body.songId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to add favorite: user ${body.userId}, song ${body.songId}`, error.stack)
      throw error
    }
  }

  @Delete(':userId/:songId')
  @Auth([AuthType.Bearer])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Remove song from favorites',
    description: 'Remove a song from user favorites collection. Requires authentication. Permanently removes the favorite entry.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiParam({ name: 'songId', type: Number, description: 'Song ID to remove from favorites' })
  @ApiOkResponse({ description: 'Song removed from favorites successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Favorite not found' })
  removeFavorite(@Param('userId', ParseIntPipe) userId: number, @Param('songId', ParseIntPipe) songId: number) {
    try {
      this.logger.log(`Remove favorite: user ${userId}, song ${songId}`)
      const result = this.favoriteService.removeFavorite(userId, songId)
      this.logger.log(`Favorite removed: user ${userId}, song ${songId}`)
      return result
    } catch (error) {
      this.logger.error(`Failed to remove favorite: user ${userId}, song ${songId}`, error.stack)
      throw error
    }
  }
}
