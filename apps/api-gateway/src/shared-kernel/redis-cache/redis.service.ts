import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>("REDIS_HOST") || "localhost",
      port: this.configService.get<number>("REDIS_PORT") || 6379,
      password: this.configService.get<string>("REDIS_PASSWORD") || undefined,
    });

    this.client.on("connect", () => Logger.log("Redis connected!"));
    this.client.on("error", (err) => Logger.error("Redis error:", err));
  }

  async onModuleInit() {
    Logger.log("RedisService initialized");
  }

  async onModuleDestroy() {
    await this.client.quit();
    Logger.log("RedisService closed");
  }

  async set(key: string, value: string, ttl?: number) {
    await this.client.set(key, value);
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
