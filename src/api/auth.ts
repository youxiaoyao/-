import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  code: number;
  msg: string;
  token?: string;
  username?: string;
}

// 登录
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/login', data);
  return response.data;
};

// 注册
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/register', data);
  return response.data;
};
