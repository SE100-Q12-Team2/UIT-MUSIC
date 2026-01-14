import { Module } from '@nestjs/common'
import { ContactController } from './contact.controller'
import { ContactService } from './contact.service'
import { ContactRepository } from './contact.repo'

@Module({
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}
