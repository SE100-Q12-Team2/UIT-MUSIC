import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTH_TYPE_KEY, AuthType, ConditionGuard } from 'src/shared/constants/auth.constant'
import { AccessTokenGuard } from 'src/shared/guard/access-token.guard'
import { PaymentApiKeyGuard } from 'src/shared/guard/payment-api-key.guard'

import { AuthTypeDecoratorPayload } from 'src/shared/types/auth.type'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly paymentApiKeyGuard: PaymentApiKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.PaymentApiKey]: this.paymentApiKeyGuard,
      [AuthType.None]: { canActivate: () => true },
    }
  }

  async getAuthTypeValues(context: ExecutionContext) {
    return (
      this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? { authTypes: [AuthType.Bearer], options: { condition: ConditionGuard.And } }
    )
  }

  async handleOrCondition(guards: CanActivate[], context: ExecutionContext) {
    let lastErr: any = null

    for (const guard of guards) {
      try {
        if (await guard.canActivate(context)) return true
      } catch (error) {
        lastErr = error
        return false
      }
    }

    if (lastErr instanceof HttpException) {
      throw lastErr
    }

    throw new UnauthorizedException()
  }

  async handleAndCondition(guards: CanActivate[], context: ExecutionContext) {
    for (const guard of guards) {
      try {
        if (!(await guard.canActivate(context))) {
          throw new UnauthorizedException()
        }
      } catch (error) {
        if (error instanceof HttpException) {
          console.log('error', error)
          throw error
        }
        throw new UnauthorizedException()
      }
    }

    return true
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValues = await this.getAuthTypeValues(context)

    const guards = authTypeValues.authTypes.map((authType) => this.authTypeGuardMap[authType])

    return authTypeValues.options.condition === ConditionGuard.And
      ? await this.handleAndCondition(guards, context)
      : await this.handleOrCondition(guards, context)
  }
}
