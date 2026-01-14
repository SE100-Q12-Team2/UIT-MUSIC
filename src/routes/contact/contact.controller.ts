import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { ContactService } from './contact.service'
import { CreateContactFormDto, UpdateContactFormStatusDto, ContactFormResponseDto } from './contact.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name)

  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth([AuthType.None])
  @ZodSerializerDto(ContactFormResponseDto)
  @ApiOperation({
    summary: 'Submit contact form',
    description: 'Submit a contact form. Can be used by both authenticated and unauthenticated users.',
  })
  @ApiBody({ type: CreateContactFormDto, description: 'Contact form data' })
  @ApiCreatedResponse({ description: 'Contact form submitted successfully', type: ContactFormResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid contact form data' })
  async createContactForm(@ActiveUser('userId') userId: number | undefined, @Body() body: CreateContactFormDto) {
    try {
      this.logger.log(`Submit contact form from ${body.email}`)
      const result = await this.contactService.createContactForm(userId || null, body)
      this.logger.log(`Contact form ${result.id} created`)
      return result
    } catch (error) {
      this.logger.error(`Failed to create contact form`, error.stack)
      throw error
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ContactFormResponseDto)
  @ApiOperation({
    summary: 'Get all contact forms',
    description: 'Get all contact forms. Admin can see all, users can see only their own.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['Pending', 'InProgress', 'Resolved', 'Closed'] })
  @ApiOkResponse({ description: 'Contact forms retrieved successfully', type: [ContactFormResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getAllContactForms(
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string,
    @Query('status') status?: string,
  ) {
    try {
      this.logger.log(`Get all contact forms`)
      
      const filters: any = {}
      if (status) filters.status = status
      if (roleName !== 'Admin') {
        filters.userId = userId
      }

      const result = await this.contactService.getAllContactForms(filters)
      this.logger.log(`Retrieved ${result.length} contact forms`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get contact forms`, error.stack)
      throw error
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ContactFormResponseDto)
  @ApiOperation({
    summary: 'Get contact form by ID',
    description: 'Get a specific contact form by ID.',
  })
  @ApiOkResponse({ description: 'Contact form retrieved successfully', type: ContactFormResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Contact form not found' })
  async getContactForm(@Param('id') id: string) {
    try {
      this.logger.log(`Get contact form ${id}`)
      const result = await this.contactService.getContactForm(parseInt(id))
      this.logger.log(`Contact form ${id} retrieved`)
      return result
    } catch (error) {
      this.logger.error(`Failed to get contact form ${id}`, error.stack)
      throw error
    }
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ContactFormResponseDto)
  @ApiOperation({
    summary: 'Update contact form status',
    description: 'Update the status of a contact form. Admin only.',
  })
  @ApiBody({ type: UpdateContactFormStatusDto, description: 'Status update data' })
  @ApiOkResponse({ description: 'Contact form status updated successfully', type: ContactFormResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid status data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Contact form not found' })
  async updateContactFormStatus(@Param('id') id: string, @Body() body: UpdateContactFormStatusDto) {
    try {
      this.logger.log(`Update contact form ${id} status to ${body.status}`)
      const result = await this.contactService.updateContactFormStatus(parseInt(id), body)
      this.logger.log(`Contact form ${id} status updated`)
      return result
    } catch (error) {
      this.logger.error(`Failed to update contact form ${id} status`, error.stack)
      throw error
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Delete contact form',
    description: 'Delete a contact form. Admin only.',
  })
  @ApiOkResponse({ description: 'Contact form deleted successfully', type: MessageResDTO })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Contact form not found' })
  async deleteContactForm(@Param('id') id: string) {
    try {
      this.logger.log(`Delete contact form ${id}`)
      const result = await this.contactService.deleteContactForm(parseInt(id))
      this.logger.log(`Contact form ${id} deleted`)
      return result
    } catch (error) {
      this.logger.error(`Failed to delete contact form ${id}`, error.stack)
      throw error
    }
  }
}
