import { Schedule } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 获取所有课表
export const getAllSchedules = (): Schedule[] => {
  return JSON.parse(localStorage.getItem('schedules') || '[]');
};

// 添加课程
export const addSchedule = (schedule: Omit<Schedule, 'id'>): void => {
  const schedules = getAllSchedules();
  schedules.push({ ...schedule, id: uuidv4() });
  localStorage.setItem('schedules', JSON.stringify(schedules));
};

// 删除课程
export const deleteSchedule = (scheduleId: string): void => {
  const schedules = getAllSchedules().filter(s => s.id !== scheduleId);
  localStorage.setItem('schedules', JSON.stringify(schedules));
};

// 获取本周课表（按星期分组）
export const getWeekSchedules = (): Record<string, Schedule[]> => {
  const schedules = getAllSchedules();
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const result: Record<string, Schedule[]> = weekDays.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as Record<string, Schedule[]>);

  schedules.forEach(schedule => {
    if (weekDays.includes(schedule.day)) {
      result[schedule.day].push(schedule);
    }
  });
  return result;
};