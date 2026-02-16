import { createHmac } from "crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";

import {
  AdminUpdateUserAttributesCommand,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import axios from "axios";

import {
  ConfirmForgotPasswordInterface,
  SigninInterface,
  SignupInterface,
} from "src/auth/interface/index";

@Injectable()
export class CognitoService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly poolClientId: string;
  private readonly userPoolId: string;
  constructor(private readonly configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get("AWS_REGION"),
    });
    this.poolClientId = this.configService.get("AWS_COGNITO_POOL_CLIENT_ID");
    this.userPoolId = this.configService.get("AWS_USER_POOL_ID");
  }

  async socialSignin() {
    const clientId = this.configService.get("CLIENT_ID");
    const redirectUri = this.configService.get("REDIRECT_URI");
    const domain = this.configService.get("DOMAIN");
    return `https://${domain}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=openid+email+profile`;
  }

  async confirmSocialSignin(code: string) {
    const cognito_id = this.configService.get("CLIENT_ID");
    const cognito_secret = this.configService.get("CLIENT_SECRET");
    const redirectUri = this.configService.get("REDIRECT_URI");
    const token_url = this.configService.get("OAUTH_TOKEN_URL");

    const result = btoa(`${cognito_id}:${cognito_secret}`);
    try {
      const response = await axios.post(
        token_url,
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: cognito_id,
          code: code,
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${result}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new RpcException({
        status: error?.response?.status,
        message: error.message,
      });
    }
  }

  async signup(signupDetails: SignupInterface) {
    const secretHash = this.generateSecretHash(signupDetails.email);
    const signupCommand: SignUpCommand = new SignUpCommand({
      ClientId: this.poolClientId,
      SecretHash: secretHash,
      Username: signupDetails.email,
      Password: signupDetails.password,
    });
    return this.cognitoClient.send(signupCommand);
  }

  async confirmSignup(userName: string, confirmationCode: string) {
    const secretHash = this.generateSecretHash(userName);
    const confirmSignupCommand = new ConfirmSignUpCommand({
      ClientId: this.poolClientId,
      SecretHash: secretHash,
      Username: userName,
      ConfirmationCode: confirmationCode,
    });

    return this.cognitoClient.send(confirmSignupCommand);
  }

  async signin(signinDetails: SigninInterface) {
    const secretHash = this.generateSecretHash(signinDetails.email);
    const initiateAuthCommand = new InitiateAuthCommand({
      ClientId: this.poolClientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: signinDetails.email,
        PASSWORD: signinDetails.password,
        SECRET_HASH: secretHash,
      },
    });
    return this.cognitoClient.send(initiateAuthCommand);
  }

  async forgotPassword(userName: string) {
    const secretHash = this.generateSecretHash(userName);
    const forgotPasswordCommand = new ForgotPasswordCommand({
      ClientId: this.poolClientId,
      Username: userName,
      SecretHash: secretHash,
    });
    return this.cognitoClient.send(forgotPasswordCommand);
  }

  async confirmForgotPassword(
    confirmForgotPasswordDetails: ConfirmForgotPasswordInterface,
  ) {
    const secretHash = this.generateSecretHash(
      confirmForgotPasswordDetails.email,
    );
    const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
      ClientId: this.poolClientId,
      Username: confirmForgotPasswordDetails.email,
      Password: confirmForgotPasswordDetails.password,
      ConfirmationCode: confirmForgotPasswordDetails.confirmationCode,
      SecretHash: secretHash,
    });
    return this.cognitoClient.send(confirmForgotPasswordCommand);
  }

  async getUserDetails(idToken: string) {
    const decoded = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString(),
    );
    return {
      username: decoded["cognito:username"],
      userAttributes: decoded,
    };
  }

  async getUser(accessToken: string) {
    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken,
    });
    // return this.cognitoClient.send(getUserCommand);
    const response = await this.cognitoClient.send(getUserCommand);
    return {
      username: response.Username,
      userAttributes: response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    };
  }

  async resendConfirmationCode(email: string) {
    const secretHash = this.generateSecretHash(email);
    const resendConfirmationCodeCommand = new ResendConfirmationCodeCommand({
      Username: email,
      ClientId: this.poolClientId,
      SecretHash: secretHash,
    });
    return this.cognitoClient.send(resendConfirmationCodeCommand);
  }

  generateSecretHash(username: string) {
    const hasher = createHmac(
      "sha256",
      this.configService.get("AWS_COGNITO_SECRET_HASH"),
    );
    hasher.update(
      `${username}${this.configService.get("AWS_COGNITO_POOL_CLIENT_ID")}`,
    );
    return hasher.digest("base64");
  }

  async resetPassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const changeCommand = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: currentPassword,
      ProposedPassword: newPassword,
    });
    return await this.cognitoClient.send(changeCommand);
  }

  async changeEmail(currentEmail, newEmail: string) {
    const changeEmailCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: currentEmail,
      UserAttributes: [
        {
          Name: "email",
          Value: newEmail,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
    });

    return await this.cognitoClient.send(changeEmailCommand);
  }
}
