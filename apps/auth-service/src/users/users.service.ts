import { ConflictException, HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";

import axios from "axios";

import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { CognitoService } from "src/shared-kernel/utils/services/aws/cognito.service";
import { SendGridServices } from "src/shared-kernel/utils/services/send-grid/send-grid.service";

import { KycDto } from "./dto/kyc.dto";
import { UserRepository } from "./repositories/user.repository";
import { UserDocument } from "./schema/user.schema";

@Injectable()
export class UsersService {
  private rareAgoraMail;
  constructor(
    private readonly sendGridServices: SendGridServices,
    private readonly userRepository: UserRepository,
    private readonly cognitoService: CognitoService,
    private readonly configService: ConfigService,
  ) {
    this.rareAgoraMail = this.configService.get("RARE_AGORA_SUPPORT_MAIL");
  }

  async getUserDetail(userId: string) {
    try {
      const userDetail = await this.userRepository.findById(userId);
      return userDetail;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async updateUserDetail(user, updatedData) {
    try {
      const { update_type } = updatedData;
      let { updatedData: newData } = updatedData;

      newData = JSON.parse(newData);

      if (update_type === "update_profile") {
        if (newData.dateOfBirth) {
          const [day, month, year] = newData.dateOfBirth.split("/");
          newData.dateOfBirth = new Date(`${year}-${month}-${day}`);
        }
        await this.userRepository.updateById(user?._id, newData);
        return this.userRepository.findById(user?._id);
      } else if (update_type === "update_email") {
        try {
          await this.cognitoService.signin({
            email: user?.email,
            password: newData.password,
          });

          if (user?.email === newData.newEmail) {
            throw new RpcException({
              status: 400,
              message: "New email should not be same as current email",
            });
          }

          await this.cognitoService.changeEmail(user?.email, newData.newEmail);
          return await this.userRepository.updateById(user?._id, {
            email: newData.newEmail,
          });
        } catch (error) {
          throw new RpcException({
            status: 400,
            message: error?.message,
          });
        }
      } else if (update_type === "update_password") {
        try {
          const authAccessResponse = await this.cognitoService.signin({
            email: user?.email,
            password: newData.currentPassword,
          });
          if (newData.newPassword !== newData.confirmPassword) {
            throw new RpcException({
              status: 400,
              message: "New Password does not match with confirm password",
            });
          }
          if (newData.newPassword === newData.currentPassword) {
            throw new RpcException({
              status: 400,
              message: "New password should not be same as current password",
            });
          }
          const accessToken =
            authAccessResponse.AuthenticationResult.AccessToken;
          return await this.cognitoService.resetPassword(
            accessToken,
            newData.currentPassword,
            newData.newPassword,
          );
        } catch (error) {
          if (error.message.includes("proposedPassword")) {
            throw new RpcException({
              status: 400,
              message:
                "Password did not conform with policy: Password not long enough",
            });
          }
          throw new RpcException({
            status: 400,
            message: error?.message,
          });
        }
      } else if (update_type === "update_phone_number") {
        try {
          await this.cognitoService.signin({
            email: user?.email,
            password: newData.password,
          });
          await this.userRepository.updateById(user?._id, newData);
          return this.userRepository.findById(user?._id);
        } catch (error) {
          console.error("Error:", error);
          throw new RpcException({
            status: 400,
            message: "Current Password does not match",
          });
        }
      }
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async createApplicant(userId: string, kycDto: KycDto) {
    try {
      const response = await axios.post(
        `${process.env.KYCAID_ENDPOINT}/applicants`,
        {
          type: "PERSON",
          external_applicant_id: userId,
          first_name: kycDto.firstName,
          last_name: kycDto.lastName,
          email: kycDto.email,
        },
        {
          headers: {
            Authorization: `Token ${process.env.KYCAID_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async getVerificationUrl(userId: string, applicantId: string) {
    try {
      const response = await axios.post(
        `${process.env.KYCAID_ENDPOINT}/forms/${process.env.KYCAID_FORM_ID}/urls`,
        {
          applicant_id: applicantId,
          external_applicant_id: userId,
          redirect_url: `${process.env.KYCAID_REDIRECT_URL}?target=kyc&verification=success`,
        },
        {
          headers: {
            Authorization: `Token ${process.env.KYCAID_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async getApplicantsDetails(userId: string, applicantId: string) {
    try {
      const response = await axios.get(
        `${process.env.KYCAID_ENDPOINT}/applicants/${applicantId}`,
        {
          headers: {
            Authorization: `Token ${process.env.KYCAID_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async updateWalletAddress(user, updatedData) {
    try {
      const existingUsers = await this.userRepository.getUser({
        walletAddress: updatedData.walletAddress,
      });
      if (
        existingUsers?.length > 1 ||
        (existingUsers.length &&
          !existingUsers.find(
            (userData) =>
              String((userData as UserDocument)._id) === String(user._id),
          ))
      ) {
        throw new ConflictException(
          ERROR_MESSAGES.RESPONSES.USER.WALLET_ALREADY_USED,
        );
      }
      return await this.userRepository.updateById(user?._id, {
        walletAddress: updatedData.walletAddress,
      });
    } catch (error) {
      throw new RpcException({
        status: error?.response?.statusCode,
        message: error.message,
      });
    }
  }

  async sendContactEmail(contactDetails) {
    const mailBody = `
      <p>You have received a new support request.</p>

      <p><strong>👤 Name: </strong> ${contactDetails.name} </p>
      <p><strong>📧 Email: </strong> ${contactDetails.email}  </p>
      <p><strong>📞 Phone Number: </strong> ${contactDetails.phoneNumber}</p>

      <p><strong>📝 Message:</strong></p>
      <p>${contactDetails.help}</p>

      <p>Please follow up with the user as soon as possible.</p>
    `;
    const mailParams = this.sendGridServices.prepareMailTemplate(
      mailBody,
      this.rareAgoraMail,
      `New Contact Support Request from ${contactDetails.name}`,
    );
    return await this.sendGridServices.send(mailParams);
  }

  async verificationCallback(callbackData: any): Promise<void> {
    try {
      const { type, applicant_id, verification_status, verifications } =
        callbackData;

      const updatePayload: {
        kycVerificationStatus?: string;
        kycVerificationDetails?: string;
      } = {};

      if (verification_status) {
        updatePayload.kycVerificationStatus =
          verification_status === "pending" ? "review" : verification_status;

        if (verification_status === "pending") {
          const applicant = await this.userRepository.getUser({
            applicantId: applicant_id,
          });

          await this.sendGridServices.sendMail(
            applicant[0].email,
            `KYC: Verification result for ${applicant[0].firstName} ${applicant[0].lastName}`,
            "submitted-kyc",
            {
              name: `${applicant[0].firstName} ${applicant[0].lastName}`,
            },
          );
        }
      }

      if (verifications) {
        updatePayload.kycVerificationDetails = JSON.stringify(verifications);
      }

      if (
        type === "VERIFICATION_STATUS_CHANGED" ||
        type === "VERIFICATION_COMPLETED"
      ) {
        await this.userRepository.updateOne(
          { applicantId: applicant_id },
          updatePayload,
        );
      }
    } catch (error) {
      throw new HttpException(
        `Failed to process callback: ${error.message}`,
        400,
      );
    }
  }
}
