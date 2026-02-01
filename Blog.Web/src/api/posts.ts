import { api } from "./client";

export type PostDto = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorEmail?: string;
};

export async function getPosts() {
  const { data } = await api.get<PostDto[]>("/posts");
  return data;
}

export async function getPost(id: number) {
  const { data } = await api.get<PostDto>(`/posts/${id}`);
  return data;
}

export async function createPost(payload: { title: string; content: string }) {
  const { data } = await api.post<PostDto>("/posts", payload);
  return data;
}

export async function updatePost(id: number, payload: { title: string; content: string }) {
  const { data } = await api.put<PostDto>(`/posts/${id}`, payload);
  return data;
}

export async function deletePost(id: number) {
  await api.delete(`/posts/${id}`);
}
