import { Schedule } from '../types';

// 获取今日课表
export const getTodaySchedules = (): Schedule[] => {
  const allSchedules = JSON.parse(localStorage.getItem('schedules') || '[]') as Schedule[];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = weekDays[new Date().getDay()];
  return allSchedules.filter(schedule => schedule.day === today);
};

// 计算本周效率（备用）
export const getWeeklyEfficiency = () => {
  // 模拟数据
  return [7.5, 6.2, 8.1, 5.8, 9.0, 4.5, 6.8];
};