import { Injectable } from '@nestjs/common'
import { compare, genSalt, hash } from 'bcrypt'

const salt = 10
@Injectable()
export class HashingService {
  hash(data: string) {
    return hash(data, salt)
  }

  compare(data: string, encrypted: string) {
    return compare(data, encrypted)
  }
}
