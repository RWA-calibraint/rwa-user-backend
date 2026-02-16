export const CACHE_KEYS = {
  ASSET_LIST: (page: string, limit: string, search: string) =>
    `assets:list:${page}:${limit}:${search || "all"}`,
  CATEGORY_IMAGES: (categoryId: string) => `category:images:${categoryId}`,
  ASSET_DETAILS: (assetId: string) => `asset:details:${assetId}`,
  USER_WISHLIST: (userId: string) => `user:wishlist:${userId}`,
  PRICE_HISTORY: (assetId: string) => `price:history:${assetId}`,
  ALL_CATEGORIES: "categories:all",
  CATEGORY_LIST: "categories:list",
  ALL_ASSETS_PATTERN: "assets:all",
  CATEGORY_PATTERN: "category:*",
  DOCUMENT_LIST: (page: string, limit: string) =>
    `document:list:${page}:${limit}`,
  DOCUMENT_DETAILS: (documentId: string) => `document:details:${documentId}`,
  DOCUMENT_LIST_PATTERN: "document:list",
};
