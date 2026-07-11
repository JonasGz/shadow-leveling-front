import { api } from "./api";
import type {
  Group,
  GroupDetail,
  RankingEntry,
  FeedPage,
} from "../types/api.types";

// buildImageForm wraps a local image URI (from expo-image-picker) into the
// multipart form the backend expects under the "image" field.
export function buildImageForm(uri: string): FormData {
  const form = new FormData();
  const name = uri.split("/").pop() ?? "photo.jpg";
  const ext = name.split(".").pop()?.toLowerCase();
  const type = ext === "png" ? "image/png" : "image/jpeg";
  // React Native's FormData accepts this {uri,name,type} shape for files.
  form.append("image", { uri, name, type } as unknown as Blob);
  return form;
}

const multipartHeaders = { "Content-Type": "multipart/form-data" };

export const groupsService = {
  async list(): Promise<Group[]> {
    const { data } = await api.get<Group[]>("/groups");
    return data;
  },

  async create(name: string): Promise<Group> {
    const { data } = await api.post<Group>("/groups", { name });
    return data;
  },

  async join(inviteCode: string): Promise<Group> {
    const { data } = await api.post<Group>("/groups/join", {
      invite_code: inviteCode,
    });
    return data;
  },

  async get(id: string): Promise<GroupDetail> {
    const { data } = await api.get<GroupDetail>(`/groups/${id}`);
    return data;
  },

  async ranking(id: string): Promise<RankingEntry[]> {
    const { data } = await api.get<RankingEntry[]>(`/groups/${id}/ranking`);
    return data;
  },

  async feed(id: string, cursor?: string): Promise<FeedPage> {
    const { data } = await api.get<FeedPage>(`/groups/${id}/feed`, {
      params: cursor ? { cursor } : {},
    });
    return data;
  },

  async setCover(id: string, uri: string): Promise<Group> {
    const { data } = await api.patch<Group>(
      `/groups/${id}/cover`,
      buildImageForm(uri),
      { headers: multipartHeaders }
    );
    return data;
  },

  async leave(id: string): Promise<void> {
    await api.delete(`/groups/${id}/leave`);
  },
};
