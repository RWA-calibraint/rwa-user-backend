import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";

import { Response } from "express";
import { map, Observable } from "rxjs";

@Injectable()
export class LoginInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    return next.handle().pipe(
      map(({ response: { accessToken } }) => {
        const response = context.switchToHttp().getResponse<Response>();
        response.cookie("user-access-token", accessToken, {
          httpOnly: true,
          secure: true,
          domain: ".rareagora.com",
        });
        return { accessToken };
      }),
    );
  }
}
