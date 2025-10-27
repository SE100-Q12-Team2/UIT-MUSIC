import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
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

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * GET /favorites?userId=1&limit=20&page=1&sort=likedAt&order=desc
   */
  @Get()
  @ZodSerializerDto(GetFavoritesResponseDTO)
  getUserFavorites(@Query() query: GetFavoritesQueryDTO) {
    return this.favoriteService.getUserFavorites(query)
  }

  /**
   * GET /favorites/check?userId=1&songId=123
   */
  @Get('check')
  @ZodSerializerDto(CheckFavoriteResDTO)
  checkFavorite(@Query() query: CheckFavoriteQueryDTO) {
    return this.favoriteService.checkFavorite(Number(query.userId), Number(query.songId))
  }

  @Get('count/:userId')
  getUserFavoriteCount(@Param('userId') userId: string) {
    return this.favoriteService.getUserFavoriteCount(Number(userId))
  }

  @Get('songs/:userId')
  getUserFavoriteSongIds(@Param('userId') userId: string) {
    return this.favoriteService.getUserFavoriteSongIds(Number(userId))
  }

  @Post()
  @ZodSerializerDto(AddFavoriteResDTO)
  addFavorite(@Body() body: AddFavoriteBodyDTO) {
    return this.favoriteService.addFavorite(body)
  }

  @Delete(':userId/:songId')
  @ZodSerializerDto(MessageResDTO)
  removeFavorite(@Param('userId') userId: string, @Param('songId') songId: string) {
    return this.favoriteService.removeFavorite(Number(userId), Number(songId))
  }
}
