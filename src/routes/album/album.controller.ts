import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe } from '@nestjs/common'
import { AlbumService } from './album.service'
import {
  GetAlbumsQueryDto,
  CreateAlbumDto,
  UpdateAlbumDto,
  AlbumResponseDto,
  PaginatedAlbumsResponseDto,
} from './album.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Auth([AuthType.None])
  @Get()
  async getAlbums(@Query() query: GetAlbumsQueryDto): Promise<PaginatedAlbumsResponseDto> {
    return this.albumService.getAlbums(query)
  }

  @Auth([AuthType.None])
  @Get(':id')
  async getAlbumById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeSongs') includeSongs?: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.getAlbumById(id, includeSongs === 'true')
  }

  @Auth([AuthType.Bearer])
  @Post()
  async createAlbum(@Body() body: CreateAlbumDto, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.albumService.createAlbum(body, user.userId)
  }

  @Auth([AuthType.Bearer])
  @Put(':id')
  async updateAlbum(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAlbumDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ) {
    return this.albumService.updateAlbum(id, body, user.userId)
  }

  @Auth([AuthType.Bearer])
  @Delete(':id')
  async deleteAlbum(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.albumService.deleteAlbum(id, user.userId)
  }

  @Auth([AuthType.None])
  @Get('label/:labelId')
  async getAlbumsByLabel(@Param('labelId', ParseIntPipe) labelId: number) {
    return this.albumService.getAlbumsByLabel(labelId)
  }
}
