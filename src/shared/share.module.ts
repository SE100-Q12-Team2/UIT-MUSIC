import { Global, Module } from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'

const sharedServices = [TokenService, HashingService]

@Global()
@Module({
  providers: [...sharedServices],
  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
