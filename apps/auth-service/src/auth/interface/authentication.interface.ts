export interface SigninResponse {
  accessToken: string;
}

export interface SocialSigninResponse {
  url: string;
}

export interface SignupInterface {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userName?: string
}

export interface SigninInterface {
  email: string;
  password: string;
}

export interface SocialSigninInterface {
  provider: string;
  idToken: string;
}
