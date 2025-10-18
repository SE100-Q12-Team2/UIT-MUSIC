import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const generateRandomFileName = (filename: string) => {
  const fileExt = path.extname(filename)
  return `${uuidv4()}${fileExt}`
}
