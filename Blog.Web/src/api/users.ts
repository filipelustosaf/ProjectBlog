import { api } from "./client";

export type Role = "ADMIN" | "USER";

export type UserDto = {
  id: string;
  email: string;
  userName?: string | null;
  roles: string[]; // <- não opcional
};

export type CreateUserPayload = {
  email: string;
  password: string;
  userName?: string | null;
};

export type UpdateUserPayload = {
  email: string;
  userName?: string | null;
};

export type SetUserRoleResponse = {
  id: string;
  email: string;
  role: string;
};

export type SetUserRolesResponse = {
  id: string;
  email: string;
  roles: string[];
};

export async function getUsers() {
  const { data } = await api.get<UserDto[]>("/users");
  // garante que nunca venha roles undefined (defensivo)
  return data.map((u) => ({ ...u, roles: u.roles ?? [] }));
}

export async function getUser(id: string) {
  const { data } = await api.get<UserDto>(`/users/${id}`);
  return { ...data, roles: data.roles ?? [] };
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<UserDto>("/users", payload);
  return { ...data, roles: data.roles ?? [] };
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await api.put<UserDto>(`/users/${id}`, payload);
  return { ...data, roles: data.roles ?? [] };
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

// 1 role só (ADMIN/USER)
export async function setUserRole(id: string, role: Role) {
  const { data } = await api.put<SetUserRoleResponse>(`/users/${id}/role`, { role });
  return data;
}

// múltiplas roles (ex.: ["ADMIN","USER"])
export async function setUserRoles(id: string, roles: Role[]) {
  const { data } = await api.put<SetUserRolesResponse>(`/users/${id}/roles`, { roles });
  return data;
}
