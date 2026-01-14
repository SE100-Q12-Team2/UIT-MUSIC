import { Injectable, Logger } from '@nestjs/common'
import { ContactRepository } from './contact.repo'
import { CreateContactFormType, UpdateContactFormStatusType, ContactFormResponseType } from './contact.model'
import { ContactFormNotFoundException } from './contact.error'

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)

  constructor(private readonly contactRepository: ContactRepository) {}

  async createContactForm(userId: number | null, data: CreateContactFormType): Promise<ContactFormResponseType> {
    const contactForm = await this.contactRepository.create(userId, data)

    this.logger.log(`Created contact form ${contactForm.id} from ${data.email}`)

    return this.transformContactForm(contactForm)
  }

  async getContactForm(id: number): Promise<ContactFormResponseType> {
    const contactForm = await this.contactRepository.findById(id)

    if (!contactForm) {
      throw ContactFormNotFoundException
    }

    return this.transformContactForm(contactForm)
  }

  async getAllContactForms(filters?: { status?: string; userId?: number }) {
    const contactForms = await this.contactRepository.findAll(filters)

    return contactForms.map((form) => this.transformContactForm(form))
  }

  async updateContactFormStatus(id: number, data: UpdateContactFormStatusType): Promise<ContactFormResponseType> {
    const existing = await this.contactRepository.findById(id)

    if (!existing) {
      throw ContactFormNotFoundException
    }

    const updated = await this.contactRepository.updateStatus(id, data)

    this.logger.log(`Updated contact form ${id} status to ${data.status}`)

    return this.transformContactForm(updated)
  }

  async deleteContactForm(id: number) {
    const existing = await this.contactRepository.findById(id)

    if (!existing) {
      throw ContactFormNotFoundException
    }

    await this.contactRepository.delete(id)

    this.logger.log(`Deleted contact form ${id}`)

    return {
      success: true,
      message: 'Contact form deleted successfully',
    }
  }

  private transformContactForm(contactForm: any): ContactFormResponseType {
    return {
      id: contactForm.id,
      userId: contactForm.userId,
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      email: contactForm.email,
      phoneNumber: contactForm.phoneNumber,
      message: contactForm.message,
      status: contactForm.status,
      createdAt: contactForm.createdAt.toISOString(),
      updatedAt: contactForm.updatedAt.toISOString(),
    }
  }
}
