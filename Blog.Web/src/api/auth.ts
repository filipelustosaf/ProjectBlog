import { api } from "./client";

export type AuthResponse = {
  token: string;
  email: string;
};

export type MeResponse = {
  id: string;
  email: string;
  userName?: string | null;
  roles: string[];
};

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/register", { email, password });
  return data;
}

export async function me() {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}
