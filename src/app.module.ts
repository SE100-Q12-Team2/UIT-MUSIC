import { Module } from '@nestjs/common'
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

@Module({
  imports: [
    SharedModule,
    AuthModule,
    MediaModule,
    PlaylistModule,
    ProfileModule,
    PlaylistTracksModule,
    ArtistModule,
    GenreModule,
    SongModule,
    FavoriteModule,
    FollowModule,
    SearchModule,
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
