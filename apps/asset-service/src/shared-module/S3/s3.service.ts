import { createReadStream } from "fs";
import { basename, dirname, join } from "path";

import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuid } from "uuid";

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.get("AWS_REGION"),
      credentials: {
        accessKeyId: configService.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: configService.get("AWS_SECRET_ACCESS_KEY"),
      },
    });
    this.bucketName = configService.get("AWS_BUCKET_NAME");
  }

  async uploadFile(filePath: string, mimetype: string): Promise<string> {
    try {
      const rootPath = dirname(process.cwd());
      const fullPath = join(rootPath, "api-gateway", filePath.toString());
      const fileStream = createReadStream(fullPath);
      const key = `uploads/${uuid()}-${basename(filePath.toString())}`;
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileStream,
          ContentType: mimetype,
        },
      });

      await upload.done();

      return `https://${this.bucketName}.s3.${this.configService.get<string>("AWS_REGION")}.amazonaws.com/${key}`;
    } catch (error) {
      throw new BadRequestException({
        s3: error,
      });
    }
  }
}
