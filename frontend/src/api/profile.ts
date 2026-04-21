import { request } from "./client";
import type { Profile, ProfileUpdatePayload } from "../types/api";

export function getMyProfile() {
  return request<Profile>("/profile/me");
}

export function updateMyProfile(payload: ProfileUpdatePayload) {
  return request<Profile>("/profile/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
