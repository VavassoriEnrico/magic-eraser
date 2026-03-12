import { API_BASE_URL } from "./client";
import { createProject, deleteProject, getProjects } from "./projects";
import { createImage, deleteImage, getProjectImages, uploadImage } from "./images";

export const api = {
  baseUrl: API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  getProjectImages,
  createImage,
  uploadImage,
  deleteImage,
};

export {
  API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  getProjectImages,
  createImage,
  uploadImage,
  deleteImage,
};
