import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return { name: "Asset service", status: "OK" };
  }
}
