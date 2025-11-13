import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { SharedModule } from 'src/shared/share.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { MediaModule } from 'src/routes/media/media.module'
import { CacheModule } from '@nestjs/cache-manager'
import envConfig from 'src/shared/config'
import { createKeyv } from '@keyv/redis'
import { PlaylistModule } from 'src/routes/playlist/playlist.module'
import { ProfileModule } from 'src/routes/profile/profile.module'
import { PlaylistTracksModule } from 'src/routes/playlist-track/playlist-track.module'
import { ArtistModule } from 'src/routes/artist/artist.module'
import { FavoriteModule } from 'src/routes/favorite/favorite.module'
import { FollowModule } from 'src/routes/follow/follow.module'
import { SearchModule } from 'src/routes/search/search.module'
import { GenreModule } from 'src/routes/genre/genre.module'
import { AppService } from 'src/app.service'
import { AppController } from 'src/app.controller'
import { SongModule } from 'src/routes/song/song.module'
import { AlbumModule } from 'src/routes/album/album.module'
import { RecordLabelModule } from 'src/routes/record-label/record-label.module'
import { UserModule } from 'src/routes/user/user.module'
import { ListeningHistoryModule } from 'src/routes/listening-history/listening-history.module'
import { SubscriptionPlanModule } from 'src/routes/subscription-plan/subscription-plan.module'
import { UserSubscriptionModule } from 'src/routes/user-subscription/user-subscription.module'
import { PaymentMethodModule } from 'src/routes/payment-method/payment-method.module'
import { RoleModule } from 'src/routes/role/role.module'
import { TransactionModule } from 'src/routes/transaction/transaction.module'
import { StatisticsModule } from 'src/routes/statistics/statistics.module'
import { NotificationModule } from 'src/routes/notification/notification.module'
import { AdvertisementModule } from 'src/routes/advertisement/advertisement.module'
import { CopyrightReportModule } from 'src/routes/copyright-report/copyright-report.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SharedModule,
    AuthModule,
    MediaModule,
    PlaylistModule,
    ProfileModule,
    PlaylistTracksModule,
    ArtistModule,
    GenreModule,
    SongModule,
    AlbumModule,
    RecordLabelModule,
    FavoriteModule,
    FollowModule,
    SearchModule,
    UserModule,
    ListeningHistoryModule,
    SubscriptionPlanModule,
    UserSubscriptionModule,
    PaymentMethodModule,
    RoleModule,
    TransactionModule,
    StatisticsModule,
    NotificationModule,
    AdvertisementModule,
    CopyrightReportModule,
    CacheModule.register({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [createKeyv(envConfig.REDIS_CLOUD_URL)],
        }
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
