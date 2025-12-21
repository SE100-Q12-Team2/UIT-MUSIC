import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })
  try {
    // Lưu ý: Thứ tự TRUNCATE phải đảm bảo không vi phạm foreign key
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "favorites","follows","Rendition","Asset","listening_history",
        "playlist_songs","playlists","SongContributor","songs","albums",
        "genres","record_labels","ad_impressions","advertisements",
        "notifications","copyright_reports","daily_statistics",
        "transactions","user_subscriptions","subscription_plans",
        "payment_methods","users","Role","Permission"
      RESTART IDENTITY CASCADE
    `)
    console.log('✅ Database truncated successfully!')
  } catch (err) {
    console.error('❌ Failed to truncate database:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
