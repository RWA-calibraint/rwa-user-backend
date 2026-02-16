import { ApiProperty } from "@nestjs/swagger";
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

export class AnalyzeImageResponseDto implements ImageAnalysisResult {
  @ApiProperty({
    example: {
      width: 1920,
      height: 1080,
      format: "jpeg",
      size: 1024000,
    },
    description: "Image metadata information",
  })
  metadata: ImageMetadata;

  @ApiProperty({
    example: {
      sharpness: 0.7234,
      blurScore: 0.2766,
      motionBlur: 0.1542,
      noise: 0.0856,
      overallScore: 0.8123,
    },
    description: "Image quality metrics",
  })
  quality: ImageQualityMetrics;

  @ApiProperty({
    example: "Excellent quality image, suitable for all purposes.",
    description: "Quality assessment and recommendation",
  })
  recommendation: string;
}
