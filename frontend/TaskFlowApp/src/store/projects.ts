import { create } from 'zustand';
import { Project } from '../types';

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  setSelectedProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  
  setProjects: (projects: Project[]) => {
    // 유효한 프로젝트만 필터링
    const validProjects = projects.filter(project => 
      project && 
      project.id && 
      typeof project.id === 'string' && 
      project.name
    );
    
    if (validProjects.length !== projects.length) {
      console.warn('Invalid projects filtered out:', projects.length - validProjects.length);
    }
    
    set({ projects: validProjects, error: null });
  },
  
  addProject: (project: Project) => {
    // 유효한 프로젝트인지 확인
    if (!project || !project.id || !project.name) {
      console.warn('Invalid project not added:', project);
      return;
    }
    
    set(state => ({ 
      projects: [...state.projects, project],
      error: null 
    }));
  },
  
  updateProject: (updatedProject: Project) => {
    set(state => ({
      projects: state.projects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      ),
      selectedProject: state.selectedProject?.id === updatedProject.id 
        ? updatedProject 
        : state.selectedProject,
      error: null
    }));
  },
  
  removeProject: (projectId: string) => {
    set(state => ({
      projects: state.projects.filter(project => project.id !== projectId),
      selectedProject: state.selectedProject?.id === projectId 
        ? null 
        : state.selectedProject,
      error: null
    }));
  },
  
  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
}));