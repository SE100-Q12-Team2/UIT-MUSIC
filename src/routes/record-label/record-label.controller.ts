import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe } from '@nestjs/common'
import {
  GetRecordLabelsQueryDto,
  CreateRecordLabelDto,
  UpdateRecordLabelDto,
  RecordLabelResponseDto,
  PaginatedRecordLabelsResponseDto,
} from './record-label.dto'
import { RecordLabelService } from './record-label.service'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AccessTokenPayloadReturn } from 'src/shared/types/jwt.type'

@Controller('record-labels')
export class RecordLabelController {
  constructor(private readonly recordLabelService: RecordLabelService) {}

  @Auth([AuthType.None])
  @Get()
  async getRecordLabels(@Query() query: GetRecordLabelsQueryDto): Promise<PaginatedRecordLabelsResponseDto> {
    return this.recordLabelService.getRecordLabels(query)
  }

  @Auth([AuthType.None])
  @Get(':id')
  async getRecordLabelById(@Param('id', ParseIntPipe) id: number): Promise<RecordLabelResponseDto> {
    return this.recordLabelService.getRecordLabelById(id)
  }

  @Auth([AuthType.None])
  @Get('user/:userId')
  async getRecordLabelByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<RecordLabelResponseDto> {
    return this.recordLabelService.getRecordLabelByUserId(userId)
  }

  @Auth([AuthType.Bearer])
  @Post()
  async createRecordLabel(
    @Body() body: CreateRecordLabelDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ): Promise<RecordLabelResponseDto> {
    return this.recordLabelService.createRecordLabel(user.userId, body)
  }

  @Auth([AuthType.Bearer])
  @Put(':id')
  async updateRecordLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRecordLabelDto,
    @ActiveUser() user: AccessTokenPayloadReturn,
  ): Promise<RecordLabelResponseDto> {
    return this.recordLabelService.updateRecordLabel(id, user.userId, body)
  }

  @Auth([AuthType.Bearer])
  @Delete(':id')
  async deleteRecordLabel(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: AccessTokenPayloadReturn) {
    return this.recordLabelService.deleteRecordLabel(id, user.userId)
  }
}
