import { create } from 'zustand';
import { Task, TaskFilter } from '../types';

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: TaskFilter) => void;
  getFilteredTasks: () => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  filter: {},
  
  setTasks: (tasks: Task[]) => {
    set({ tasks, error: null });
  },
  
  addTask: (task: Task) => {
    set(state => ({ 
      tasks: [...state.tasks, task],
      error: null 
    }));
  },
  
  updateTask: (updatedTask: Task) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ),
      selectedTask: state.selectedTask?.id === updatedTask.id 
        ? updatedTask 
        : state.selectedTask,
      error: null
    }));
  },
  
  removeTask: (taskId: string) => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId 
        ? null 
        : state.selectedTask,
      error: null
    }));
  },
  
  setSelectedTask: (task: Task | null) => {
    set({ selectedTask: task });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  setFilter: (filter: TaskFilter) => {
    set({ filter });
  },
  
  getFilteredTasks: () => {
    const { tasks, filter } = get();
    
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.assigneeId && task.assignee?.id !== filter.assigneeId) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  },
}));