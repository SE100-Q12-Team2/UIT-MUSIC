import { PrismaService } from 'src/shared/services/prisma.service'
import { MeilisearchService } from 'src/shared/services/meilisearch.service'
import { SearchIndexService } from 'src/routes/search/search-index.service'

async function main() {
  console.log('🚀 Starting Meilisearch indexing...')

  const prisma = new PrismaService()
  await prisma.$connect()

  const meili = new MeilisearchService()
  await meili.onModuleInit()

  const indexService = new SearchIndexService(prisma, meili)

  console.log('🗑️  Clearing existing indexes...')
  await meili.clearAllIndexes()

  await indexService.indexAllData()

  const stats = await meili.getStats()
  console.log('\n📊 Indexing Statistics:')
  console.log(`  Songs: ${stats.songs.numberOfDocuments} documents`)
  console.log(`  Albums: ${stats.albums.numberOfDocuments} documents`)
  console.log(`  Artists: ${stats.artists.numberOfDocuments} documents`)
  console.log(`  Playlists: ${stats.playlists.numberOfDocuments} documents`)

  await prisma.$disconnect()
  console.log('\n✅ Indexing completed successfully!')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Indexing failed:', error)
  process.exit(1)
})
