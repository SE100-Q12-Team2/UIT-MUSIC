import { Injectable } from '@nestjs/common'
import { AuthRepository } from 'src/routes/auth/auth.repo'

@Injectable()
export class AuthService {
  constructor(private readonly AuthRepository: AuthRepository) {}
}
