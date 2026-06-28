/**
 * A normalized news headline, provider-agnostic.
 *
 * `assetTags` are canonical asset symbols this item is relevant to (mapped by
 * the adapter), used by context retrieval to attach catalysts to moves.
 */
export interface NewsItem {
  readonly id: string;
  readonly headline: string;
  readonly summary?: string;
  readonly url?: string;
  readonly source: string;
  readonly assetTags: readonly string[];
  readonly publishedAt: string; // ISO-8601 UTC
}
