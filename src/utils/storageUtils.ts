// 导入类型定义
import { Task, Schedule } from '../types';

// 获取今日任务
export const getTodayTasks = (): Task[] => {
  const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
  const today = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
  return allTasks.filter(task => task.deadline === today);
};

// 新增任务（备用）
export const addTask = (task: Task) => {
  const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
  allTasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(allTasks));
};

// 获取所有课表
export const getAllSchedules = (): Schedule[] => {
  return JSON.parse(localStorage.getItem('schedules') || '[]') as Schedule[];
};