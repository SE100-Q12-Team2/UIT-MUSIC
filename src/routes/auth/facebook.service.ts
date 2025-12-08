import { ForbiddenException, Injectable } from '@nestjs/common'

import { AuthRepository } from 'src/routes/auth/auth.repo'
import { AuthService } from 'src/routes/auth/auth.service'
import { HashingService } from 'src/shared/services'
import * as crypto from 'crypto'
import envConfig from 'src/shared/config'
import { FacebookUrlStateType } from 'src/routes/auth/auth.model'
import axios from 'axios'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'

@Injectable()
export class FacebookService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly shareRoleRepo: SharedRoleRepository,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
  ) {}

  static makeCsrf() {
    return crypto.randomBytes(32).toString('base64url')
  }

  async getFacebookLink({ userAgent, userIp }: { userAgent: string; userIp: string }) {
    const stateObj: FacebookUrlStateType = {
      userAgent,
      userIp,
    }
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64')

    const params = new URLSearchParams({
      client_id: envConfig.FACEBOOK_APP_ID,
      response_type: 'code',
      redirect_uri: envConfig.FACEBOOK_OAUTH_REDIRECT_URI,
      scope: 'email,public_profile',
      state,
    })

    const url = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`

    return { url }
  }

  async exchangeCodeToToken(code: string) {
    const params = new URLSearchParams({
      client_id: envConfig.FACEBOOK_APP_ID,
      client_secret: envConfig.FACEBOOK_APP_SECRET,
      redirect_uri: envConfig.FACEBOOK_OAUTH_REDIRECT_URI,
      code,
    })

    const { data } = await axios.get(`https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`)

    return data.access_token as string
  }

  private async getProfile(accessToken: string) {
    const fields = 'id,name,email,picture.type(large)'
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/me`, {
      params: { fields, access_token: accessToken },
    })
    return data as { id: string; name?: string; email?: string; picture?: { data?: { url?: string } } }
  }

  async facebookCallBack({ code, state }: { code: string; state: string }) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64').toString()) as FacebookUrlStateType

      const userAgent = parsed.userAgent ?? 'Unknown'
      const userIp = parsed.userIp ?? 'Unknown'

      const fbAccessToken = await this.exchangeCodeToToken(code)
      const profile = await this.getProfile(fbAccessToken)

      if (!profile.id) {
        throw new Error('Cannot get user info from Facebook')
      }

      const email = profile.email || null

      let user = email ? await this.authRepository.findUniqueUserIncludeRole({ email }) : null

      if (!user) {
        const hashedPassword = await this.hashingService.hash(profile.id)
        const clientRoleId = await this.shareRoleRepo.getClientRoleId()

        user = await this.authRepository.createUserIncludeRole({
          profileImage: profile.picture?.data?.url || null,
          email: profile.email || '',
          fullName: profile.name || '',
          password: hashedPassword,
          roleId: clientRoleId,
        })
      }

      const device = await this.authRepository.createDevice({
        userId: user.id,
        ip: userIp,
        userAgent,
      })

      const authTokens = await this.authService.generateTokens({
        deviceId: device.id,
        userId: user.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
      }
    } catch (error) {
      console.log('Error in facebook callback', error)
      throw error
    }
  }
}
