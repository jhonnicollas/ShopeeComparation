import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./api.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
}

export async function me(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
  });
}

export interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isError: boolean;
}

export function useAuth(): UseAuthResult {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  return {
    user: query.data?.user ?? null,
    isLoading: query.isLoading,
    isAuthenticated: query.isSuccess && !!query.data?.user,
    isError: query.isError,
  };
}
