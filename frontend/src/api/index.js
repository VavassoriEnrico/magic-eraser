import { API_BASE_URL } from "./client";
import { createProject, deleteProject, getProjects } from "./projects";
import { deleteImage, getProjectImages, uploadImage } from "./images";

export const api = {
  baseUrl: API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  getProjectImages,
  uploadImage,
  deleteImage,
};

export {
  API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  getProjectImages,
  uploadImage,
  deleteImage,
};
