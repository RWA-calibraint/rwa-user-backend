import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClientProxy } from "@nestjs/microservices";

import * as jwt from "jsonwebtoken";
import { firstValueFrom } from "rxjs";

import { IS_PUBLIC_KEY } from "src/shared-kernel/constants/decorator-contents";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) throw new UnauthorizedException();
    try {
      let userData;
      const decodedToken = this.decodeJWT(token);

      if (decodedToken?.auth === "google") {
        userData = await firstValueFrom(
          this.authClient.send("validate_oauth_token", { decodedToken }),
        );
      } else {
        userData = await firstValueFrom(
          this.authClient.send("validate_token", { token }),
        );
      }

      if (userData?.isValid) {
        request.user = userData;
        return true;
      } else {
        throw new UnauthorizedException("Invalid token");
      }
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private decodeJWT(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}
