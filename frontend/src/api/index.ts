import { API_BASE_URL } from "./client";
import { createProject, deleteProject, getProjects, updateProject } from "./projects";
import { deleteImage, getProjectImages, uploadImage } from "./images";
import { runProcess } from "./processes";

export const api = {
  baseUrl: API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  updateProject,
  getProjectImages,
  uploadImage,
  deleteImage,
  runProcess,
};

export {
  API_BASE_URL,
  getProjects,
  createProject,
  deleteProject,
  updateProject,
  getProjectImages,
  uploadImage,
  deleteImage,
  runProcess,
};
