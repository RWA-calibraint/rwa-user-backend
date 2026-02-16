export interface GetSoldAssetByUser {
  searchValue?: string;
  categories?: string[];
  from?: string;
  to?: string;
  userId: string;
  page?: number;
  size?: number;
  min?: string;
  max?: string;
  sortBy?: string;
}
