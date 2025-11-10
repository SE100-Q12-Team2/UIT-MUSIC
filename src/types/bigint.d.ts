/**
 * Extend BigInt prototype to support JSON serialization
 * This allows BigInt values to be automatically converted to Number when stringifying to JSON
 */
interface BigInt {
  /**
   * Convert BigInt to Number for JSON serialization
   * @returns Number representation of the BigInt value
   */
  toJSON(): number
}
