import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import envConfig from 'src/shared/config'

@Injectable()
export class PaymentApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()

    const paymentApiKey = request.headers['authorization']?.split(' ')[1]

    if (paymentApiKey !== envConfig.PAYMENT_API_KEY_SECRET) {
      throw new UnauthorizedException()
    }

    return true
  }
}
