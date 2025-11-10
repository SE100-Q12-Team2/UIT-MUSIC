export const SongOrder = {
  LATEST: 'latest',
  POPULAR: 'popular',
  TITLE: 'title',
} as const

export type SongOrderType = (typeof SongOrder)[keyof typeof SongOrder]
