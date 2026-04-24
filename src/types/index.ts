// 移除难度字段
export interface Task {
  id: string;
  name: string;
  category: string;
  subject: string;
  estimatedTime: number;
  deadline: string; // 格式：YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  recommendedTime?: string;
}

export interface Schedule {
  id: string;
  name: string;
  teacher: string;
  location: string;
  weekRange: string;
  day: string;
  startTime: string;
  endTime: string;
}