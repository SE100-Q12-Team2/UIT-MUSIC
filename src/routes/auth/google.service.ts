import { Injectable } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { GoogleUrlStateType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { AuthService } from 'src/routes/auth/auth.service'
import envConfig from 'src/shared/config'
import { SharedRoleRepository } from 'src/shared/repository/shared-role.repo'
import { HashingService } from 'src/shared/services'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly shareRoleRepo: SharedRoleRepository,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_CLIENT_REDIRECT_URI,
    )
  }

  async getGoogleLink({ userAgent, userIp }: GoogleUrlStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']

    const stateString = Buffer.from(
      JSON.stringify({
        userAgent,
        userIp,
      }),
    ).toString('base64')

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })

    return { url }
  }

  async googleCallBack({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'Unknown'
      let userIp = 'Unknown'

      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString()) as GoogleUrlStateType
          userAgent = clientInfo.userAgent
          userIp = clientInfo.userIp
        }
      } catch (error) {
        console.log('Error parsing client info', error)
      }

      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({
        version: 'v2',
        auth: this.oauth2Client,
      })

      const { data } = await oauth2.userinfo.get()

      if (!data.email) {
        throw new Error('Cannot get user info')
      }

      let user = await this.authRepository.findUniqueUserIncludeRole({
        email: data.email,
      })

      if (!user) {
        const clientRoleId = await this.shareRoleRepo.getClientRoleId()
        const hashedPassword = await this.hashingService.hash(uuidv4())

        user = await this.authRepository.createUserIncludeRole({
          profileImage: data.picture ?? null,
          email: data.email,
          fullName: data.name || '',
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
        roleId: user.roleId,
        userId: user.id,
        roleName: user.role.name,
      })

      return authTokens
    } catch (error) {
      console.log('Error in google callback', error)
      throw error
    }
  }
}
