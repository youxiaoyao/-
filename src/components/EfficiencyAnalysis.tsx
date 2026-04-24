import React, { useEffect, useState } from 'react';
import { Task } from '../types';

// 后端接口基础地址（和其他组件保持一致）
const API_BASE_URL = '/api';

// 从后端获取所有任务（替换原localStorage读取）
const getAllTasks = async (): Promise<Task[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    // 后端字段映射到前端（保持和原Task类型一致）
    return data.data.map((item: any) => ({
      id: item.id.toString(), // 后端id转字符串
      name: item.name || '',
      category: item.subject ? '学习' : '生活', // 后端subject映射到category
      subject: item.subject || '',
      estimatedTime: item.duration ? item.duration / 60 : 0, // 后端分钟转小时
      deadline: item.deadline || new Date().toISOString().split('T')[0],
      priority: item.priority || 'medium',
      completed: item.is_completed || false, // 后端is_completed映射到completed
      recommendedTime: '' // 后端暂未存储，留空不影响统计
    }));
  } catch (err) {
    console.error('【后端接口异常】获取任务失败：', err);
    alert('获取任务数据失败，暂显示本地数据！');
    // 降级处理：读取本地数据，避免页面空白
    return JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
  }
};

// 计算本周各天的学习时长（保留原逻辑）
const calculateWeeklyHours = (tasks: Task[]) => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  // 初始化本周7天的时长为0
  const weeklyHours = weekDays.map(() => 0);
  
  tasks.forEach(task => {
    if (!task.completed) return; // 只统计已完成任务
    const taskDate = new Date(task.deadline);
    const taskDay = taskDate.getDay(); // 0=周日，1=周一...6=周六
    // 累加对应日期的预估时长
    weeklyHours[taskDay] += task.estimatedTime;
  });
  
  return weeklyHours;
};

const EfficiencyAnalysis: React.FC = () => {
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 实时从后端获取任务数据并计算时长（替换原localStorage读取）
  useEffect(() => {
    const fetchTasksAndCalculate = async () => {
      const tasks = await getAllTasks(); // 异步获取后端任务
      setWeeklyHours(calculateWeeklyHours(tasks));
    };
    
    fetchTasksAndCalculate();
    
    // 可选：添加定时器，实时刷新数据（每30秒更新一次）
    const timer = setInterval(fetchTasksAndCalculate, 30000);
    
    return () => clearInterval(timer); // 组件卸载时清除定时器
  }, []);

  // 计算统计数据（保留原逻辑）
  const totalHours = weeklyHours.reduce((sum, hours) => sum + hours, 0);
  const averageHours = (totalHours / 7).toFixed(1);
  const maxHours = Math.max(...weeklyHours);
  const mostEfficientDay = weekDays[weeklyHours.indexOf(maxHours)];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-xl mb-6">效率分析</h3>
      
      {/* 本周学习时长统计（柱状图）- 保留原UI */}
      <div className="mb-8">
        <h4 className="font-medium mb-4">本周学习时长（小时）</h4>
        <div className="h-[300px] relative">
          <svg width="100%" height="100%" viewBox="0 0 500 300">
            {/* 坐标轴 */}
            <line x1="50" y1="250" x2="450" y2="250" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="250" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* 柱状图（基于后端数据） */}
            {weeklyHours.map((hours, index) => {
              const x = 50 + (index * 60);
              const height = hours * 20; // 按比例缩放（避免柱子过高）
              const y = 250 - height;
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="40"
                  height={height > 0 ? height : 0}
                  fill="#818cf8"
                  rx="4"
                />
              );
            })}

            {/* 坐标轴标签（星期） */}
            {weekDays.map((day, index) => (
              <text
                key={index}
                x={50 + (index * 60) + 20}
                y={270}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {day}
              </text>
            ))}

            {/* 数值标签（时长） */}
            {weeklyHours.map((hours, index) => (
              hours > 0 && (
                <text
                  key={index}
                  x={50 + (index * 60) + 20}
                  y={250 - (hours * 20) - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#1f2937"
                >
                  {hours}h
                </text>
              )
            ))}
          </svg>
        </div>
      </div>

      {/* 效率总结（基于后端数据）- 保留原逻辑 */}
      <div className="border rounded-lg p-4 bg-indigo-50">
        <h4 className="font-medium mb-2">效率总结</h4>
        <p className="text-sm text-gray-700">
          本周总学习时长：{totalHours}小时
        </p>
        <p className="text-sm text-gray-700 mt-1">
          本周平均学习时长：{averageHours}小时
        </p>
        <p className="text-sm text-gray-700 mt-1">
          最高效的一天：{mostEfficientDay}（{maxHours}小时）
        </p>
        <p className="text-sm text-gray-700 mt-1">
          建议：{totalHours < 5 ? '本周学习时长较少，可适当增加哦～' : '合理分配每日学习时长，保持状态！'}
        </p>
      </div>
    </div>
  );
};

export default EfficiencyAnalysis;