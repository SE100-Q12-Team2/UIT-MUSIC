import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AccessTokenPayloadCreate } from '../types/jwt.type'
import { v4 as uuidv4 } from 'uuid'
import envConfig from 'src/shared/config'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenPayloadCreate) {
    return this.jwtService.signAsync(
      {
        ...payload,
        uuid: uuidv4(),
      },
      {
        secret: envConfig.ACCESS_TOKEN_SECRET,
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN,
        algorithm: 'HS256',
      },
    )
  }

  signRefreshToken(payload: AccessTokenPayloadCreate) {
    return this.jwtService.signAsync(
      {
        ...payload,
        uuid: uuidv4(),
      },
      {
        secret: envConfig.REFRESH_TOKEN_SECRET,
        expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN,
        algorithm: 'HS256',
      },
    )
  }

  
}
