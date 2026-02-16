import { HttpException, HttpStatus } from "@nestjs/common";

export const constructResponse = (
  code: number,
  status: "success" | "failure",
  result: any = null,
  error: any = null,
) => {
  return {
    response_code: code,
    response_status: status,
    response: result,
    response_error: error,
    message: error,
  };
};

export const constructSuccessResponse = (result: any) =>
  constructResponse(HttpStatus.OK, "success", result);

export const constructFailureResponse = (code: number, error: any) =>
  constructResponse(code, "failure", null, error);

export const constructErrorResponse = (error: any) => {
  const errorMessage = error?.message || "Internal Server Error";
  const statusCode =
    typeof error?.status === "number" && Number.isInteger(error.status)
      ? error.status
      : HttpStatus.BAD_REQUEST;
  throw new HttpException(
    constructFailureResponse(statusCode, errorMessage),
    statusCode,
  );
};
