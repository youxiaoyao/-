import client from './client';

export interface Task {
  id: number;
  name: string;
  subject: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  deadline: string | null;
  is_completed: boolean;
}

export interface CreateTaskRequest {
  name: string;
  subject: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  is_completed?: boolean;
}

export interface UpdateTaskRequest {
  is_completed: boolean;
}

export interface TaskResponse {
  code: number;
  msg: string;
  data?: Task[];
  id?: number;
}

// 获取所有任务
export const getAllTasks = async (): Promise<Task[]> => {
  const response = await client.get<TaskResponse>('/tasks');
  return response.data.data || [];
};

// 创建任务
export const createTask = async (data: CreateTaskRequest): Promise<number> => {
  const response = await client.post<TaskResponse>('/tasks', data);
  if (response.data.code === 200 && response.data.id) {
    return response.data.id;
  }
  throw new Error(response.data.msg || '创建任务失败');
};

// 删除任务
export const deleteTask = async (id: string | number): Promise<void> => {
  const response = await client.delete<TaskResponse>(`/tasks/${id}`);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg || '删除任务失败');
  }
};

// 更新任务状态
export const updateTaskStatus = async (id: string | number, isCompleted: boolean): Promise<void> => {
  const response = await client.patch<TaskResponse>(`/tasks/${id}`, {
    is_completed: isCompleted,
  });
  if (response.data.code !== 200) {
    throw new Error(response.data.msg || '更新任务状态失败');
  }
};
