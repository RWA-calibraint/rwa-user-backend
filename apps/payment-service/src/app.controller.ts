import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("payment/health")
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return { name: "Payments service", status: "OK" };
  }
}
