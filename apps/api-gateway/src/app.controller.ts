import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";

@SkipAuth()
@Controller()
export class AppController {
  @Get("health")
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return { name: "Api gateway service", status: "OK" };
  }
}
