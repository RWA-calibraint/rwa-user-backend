import mongoose from "mongoose";

import { Document } from "src/documents/schemas/document.schema";

import { AssetListing } from "../schemas/asset-listing.schema";
import { Asset } from "../schemas/asset.schema";
import { PriceHistory } from "../schemas/price_history.schema";

interface AssetOwnerInfo {
  name: string;
  tokenCount: number;
  purchasedDate: string;
}

interface AssetOwnerInfo {
  name: string;
  tokenCount: number;
  purchasedDate: string;
}

export interface AssetWithDocuments extends Omit<Asset, "_id"> {
  _id: string;
  tokensBought: number;
  priceHistory: PriceHistory[];
  likesCount: number;
  isLiked: boolean;
  listings: AssetListing[];
  documents: Pick<
    Document,
    "type" | "documentUrl" | "documentName" | "assetId" | "status"
  >[];
  soldTokens: number;
  availableTokens?: number;
  assetOwners?: AssetOwnerInfo[];
  availableListingTokens?: number;
  listingActivity: AssetListing[];
}

export interface SubmitExclusiveAccessInterface {
  assetId: mongoose.Types.ObjectId;
  userDetails: any;
}

// types.ts
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  isAnimated: boolean;
  colorSpace: string;
  hasAlpha: boolean;
  pageCount: number;
}

export interface ImageQualityMetrics {
  sharpness: number;
  blurScore: number;
  motionBlur: number;
  noise: number;
  overallScore: number;
  qualityLevel: string;
}

export interface ImageAnalysisResult {
  metadata: ImageMetadata;
  quality: ImageQualityMetrics;
  recommendation: string;
}

export type QualityLevel =
  | "excellent"
  | "good"
  | "average"
  | "poor"
  | "very-poor";
