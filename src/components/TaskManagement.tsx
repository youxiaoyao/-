import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { formatPureDate, getTodayPureDate } from '../utils/dateUtils';

// 后端接口基础地址（统一管理，方便后续部署修改）
const API_BASE_URL = '/api';

// 从后端获取所有任务（替换原localStorage读取）
const getAllTasks = async (): Promise<(Task & { recommendedTime?: string, id: string })[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    // 后端字段映射到前端（核心修复：统一日期格式）
    return data.data.map((task: any) => ({
      id: task.id.toString(), // 后端id是数字 → 前端统一为字符串
      name: task.name || '',
      category: task.subject ? '学习' : '生活', // 后端subject映射到前端category
      subject: task.subject || '',
      estimatedTime: task.duration ? task.duration / 60 : 1, // 后端分钟 → 前端小时
      deadline: formatPureDate(task.deadline), // 核心修复：格式化日期，去除时区
      priority: task.priority || 'medium', // 后端优先级映射
      completed: task.is_completed || false, // 后端is_completed → 前端completed
      recommendedTime: task.recommendedTime || '' // 推荐时间（后续可扩展后端存储）
    }));
  } catch (err) {
    console.error('【后端接口异常】获取任务失败：', err);
    alert('获取任务失败，请检查后端是否启动！');
    return [];
  }
};

// 获取偏好设置（保留localStorage，因为是前端本地配置）
const getPreference = () => {
  const defaultPref = { sleepTime: '23:30', wakeUpTime: '07:00' };
  return JSON.parse(localStorage.getItem('preferences') || JSON.stringify(defaultPref));
};

// 保存偏好设置（保留localStorage）
const savePreference = (pref: { sleepTime: string; wakeUpTime: string }) => {
  localStorage.setItem('preferences', JSON.stringify(pref));
};

// 获取今日课表并转换为分钟数（暂时保留localStorage，后续可对接课表接口）
const getTodayScheduleMinutes = () => {
  const today = getTodayPureDate(); // 使用纯日期
  const allSchedules = JSON.parse(localStorage.getItem('schedules') || '[]') as any[];
  return allSchedules
    .filter(s => s.date === today)
    .map(s => {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      return {
        start: startH * 60 + startM,
        end: endH * 60 + endM,
        name: s.name
      };
    });
};

// 转换时间字符串为分钟数
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// 转换分钟数为时间字符串
const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// 检查时段是否重合
const isSlotOverlap = (newSlot: { start: number; end: number }, existingSlots: { start: number; end: number }[]) => {
  return existingSlots.some(slot => 
    (newSlot.start >= slot.start && newSlot.start < slot.end) || 
    (newSlot.end > slot.start && newSlot.end <= slot.end)
  );
};

// 计算可用时间段（避免与已分配时段重合）
const calculateAvailableSlots = (pref: { sleepTime: string; wakeUpTime: string }, estimatedTime: number, existingTaskSlots: { start: number; end: number }[]): { start: number; end: number; timeStr: string } | null => {
  const sleepTotal = timeToMinutes(pref.sleepTime);
  const wakeTotal = timeToMinutes(pref.wakeUpTime);
  const estimatedTotal = estimatedTime * 60;

  // 确定今日可用的清醒时段
  let availableRanges = [];
  if (wakeTotal < sleepTotal) {
    availableRanges = [{ start: wakeTotal, end: sleepTotal }];
  } else {
    availableRanges = [{ start: wakeTotal, end: 23*60+59 }];
  }

  // 获取今日课表并排序
  const todaySchedules = getTodayScheduleMinutes().sort((a, b) => a.start - b.start);
  // 合并课表和已分配任务的时段
  const occupiedSlots = [...todaySchedules.map(s => ({ start: s.start, end: s.end })), ...existingTaskSlots];

  const freeSlots: { start: number; end: number; timeStr: string }[] = [];
  availableRanges.forEach(range => {
    let currentStart = range.start;
    const rangeEnd = range.end;

    // 遍历占用时段，切割空闲时段
    for (const slot of occupiedSlots.sort((a, b) => a.start - b.start)) {
      if (slot.end <= currentStart || slot.start >= rangeEnd) continue;
      
      // 占用时段前的空闲时间
      if (slot.start > currentStart) {
        const freeDuration = slot.start - currentStart;
        if (freeDuration >= estimatedTotal) {
          const newSlot = { start: currentStart, end: currentStart + estimatedTotal };
          if (!isSlotOverlap(newSlot, occupiedSlots)) {
            freeSlots.push({
              start: currentStart,
              end: currentStart + estimatedTotal,
              timeStr: `${minutesToTime(currentStart)}-${minutesToTime(currentStart + estimatedTotal)}`
            });
          }
        }
      }
      currentStart = Math.max(currentStart, slot.end);
    }

    // 处理最后一段空闲时间
    if (currentStart + estimatedTotal <= rangeEnd) {
      const newSlot = { start: currentStart, end: currentStart + estimatedTotal };
      if (!isSlotOverlap(newSlot, occupiedSlots)) {
        freeSlots.push({
          start: currentStart,
          end: currentStart + estimatedTotal,
          timeStr: `${minutesToTime(currentStart)}-${minutesToTime(currentStart + estimatedTotal)}`
        });
      }
    }
  });

  return freeSlots.length > 0 ? freeSlots[0] : null; // 只取第一个可用时段
};

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<(Task & { recommendedTime?: string })[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: '',
    category: '学习',
    subject: '',
    estimatedTime: 1,
    deadline: getTodayPureDate(), // 核心修复：使用纯日期
    priority: 'medium',
    completed: false
  });
  const [preference, setPreference] = useState({ sleepTime: '23:30', wakeUpTime: '07:00' });
  const [recommendedSlot, setRecommendedSlot] = useState<{ timeStr: string; start: number; end: number } | null>(null);

  // 初始化：从后端拉取任务（替换原localStorage初始化）
  useEffect(() => {
    const init = async () => {
      const initTasks = await getAllTasks(); // 异步获取后端任务
      sortTasks(initTasks);
      const initPref = getPreference();
      setPreference(initPref);
      updateRecommendedSlot(initTasks, initPref, newTask.estimatedTime || 1);
    };
    init();
  }, []);

  // 更新推荐时段（基于已有任务）
  const updateRecommendedSlot = (currentTasks: (Task & { recommendedTime?: string })[], pref: any, estimatedTime: number) => {
    // 提取已有任务的推荐时段
    const existingSlots = currentTasks
      .filter(t => t.recommendedTime)
      .map(t => {
        const [startStr, endStr] = t.recommendedTime!.split('-');
        return {
          start: timeToMinutes(startStr),
          end: timeToMinutes(endStr)
        };
      });
    // 计算新推荐时段
    const slot = calculateAvailableSlots(pref, estimatedTime, existingSlots);
    setRecommendedSlot(slot);
  };

  // 任务排序逻辑（移除localStorage存储，只更新前端状态）
  const sortTasks = (taskList: (Task & { recommendedTime?: string })[]) => {
    const sorted = [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    setTasks(sorted); // 仅更新前端状态，不再存localStorage
  };

  // 新增任务（对接后端POST接口，核心修复日期格式）
  const handleAddTask = async () => {
    if (!newTask.name?.trim() || !newTask.subject?.trim() || !recommendedSlot) {
      alert(recommendedSlot ? '请填写任务名称和学科！' : '暂无合适的推荐时间！');
      return;
    }
    try {
      // 构造后端需要的参数格式（核心修复：传递纯日期）
      const taskToBackend = {
        name: newTask.name,
        subject: newTask.subject,
        duration: (newTask.estimatedTime || 1) * 60, // 前端小时 → 后端分钟
        priority: newTask.priority || 'medium',
        deadline: formatPureDate(newTask.deadline || getTodayPureDate()), // 核心修复：纯日期
        is_completed: false,
        recommendedTime: recommendedSlot.timeStr
      };
      // 调用后端新增任务接口
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskToBackend)
      });
      const data = await res.json();
      if (data.code === 200) {
        alert('新增任务成功！');
        // 重新拉取最新任务列表
        const latestTasks = await getAllTasks();
        sortTasks(latestTasks);
        // 重置表单
        setNewTask({
          name: '',
          subject: '',
          category: '学习',
          estimatedTime: 1,
          deadline: getTodayPureDate(), // 核心修复：重置为纯日期
          priority: 'medium'
        });
        updateRecommendedSlot(latestTasks, preference, 1);
      }
    } catch (err) {
      console.error('【后端接口异常】新增任务失败：', err);
      alert('新增任务失败，请检查后端是否启动！');
    }
  };

  // 切换任务完成状态（对接后端PATCH接口）
  const toggleTaskCompletion = async (taskId: string) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;
    try {
      // 调用后端修改任务状态接口
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          is_completed: !currentTask.completed
        })
      });
      const data = await res.json();
      if (data.code === 200) {
        // 重新拉取最新任务列表
        const latestTasks = await getAllTasks();
        sortTasks(latestTasks);
      }
    } catch (err) {
      console.error('【后端接口异常】修改任务状态失败：', err);
      alert('修改任务状态失败，请检查后端是否启动！');
    }
  };

  // 删除任务（对接后端DELETE接口）
  const handleDeleteTask = async (taskId: string) => {
    try {
      // 调用后端删除任务接口
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.code === 200) {
        // 重新拉取最新任务列表
        const latestTasks = await getAllTasks();
        sortTasks(latestTasks);
        updateRecommendedSlot(latestTasks, preference, newTask.estimatedTime || 1);
        alert('删除任务成功！');
      }
    } catch (err) {
      console.error('【后端接口异常】删除任务失败：', err);
      alert('删除任务失败，请检查后端是否启动！');
    }
  };

  // 偏好/预估时长变化时更新推荐
  useEffect(() => {
    updateRecommendedSlot(tasks, preference, newTask.estimatedTime || 1);
  }, [preference, newTask.estimatedTime]);

  // 保存偏好设置
  const handleSavePreference = () => {
    savePreference(preference);
    updateRecommendedSlot(tasks, preference, newTask.estimatedTime || 1);
    alert('偏好设置已保存！');
  };

  // 优先级中文+颜色映射
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'high':
        return { text: '高优先级', color: 'text-red-500', icon: '🔴' };
      case 'medium':
        return { text: '中优先级', color: 'text-yellow-500', icon: '🟡' };
      case 'low':
        return { text: '低优先级', color: 'text-green-500', icon: '🟢' };
      default:
        return { text: '未知优先级', color: 'text-gray-500', icon: '' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-xl mb-6">任务管理</h3>
      
      {/* 偏好设置（睡眠/起床时间） */}
      <div className="border rounded-lg p-4 mb-8 bg-gray-50">
        <h4 className="font-medium mb-3">个人偏好设置</h4>
        <div className="flex gap-6 items-end">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">睡眠时间</label>
            <input
              type="time"
              value={preference.sleepTime}
              onChange={(e) => setPreference({...preference, sleepTime: e.target.value})}
              className="w-full border rounded px-3 py-2"
              step="300"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">起床时间</label>
            <input
              type="time"
              value={preference.wakeUpTime}
              onChange={(e) => setPreference({...preference, wakeUpTime: e.target.value})}
              className="w-full border rounded px-3 py-2"
              step="300"
            />
          </div>
          <button
            onClick={handleSavePreference}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
          >
            保存设置
          </button>
        </div>
      </div>

      {/* 新增任务表单 + 时间推荐 */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">任务名称</label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="输入任务名称"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">学科</label>
              <input
                type="text"
                value={newTask.subject}
                onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="输入学科名称"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">预估时长（小时）</label>
              <input
                type="number"
                value={newTask.estimatedTime}
                onChange={(e) => setNewTask({...newTask, estimatedTime: Number(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                min={0.5}
                step={0.5}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">分类</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="学习">学习</option>
                <option value="生活">生活</option>
                <option value="娱乐">娱乐</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">优先级</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'high' | 'medium' | 'low'})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">截止日期</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
        {/* 时间推荐区域 */}
        <div className="col-span-4 border rounded-lg p-3 bg-indigo-50">
          <h4 className="font-medium text-sm mb-2">本次推荐完成时间</h4>
          <p className="text-sm">
            {recommendedSlot ? recommendedSlot.timeStr : '暂无合适时段'}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleAddTask}
        disabled={!recommendedSlot}
        className={`bg-indigo-600 text-white px-4 py-2 rounded mb-8 ${!recommendedSlot ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        添加任务
      </button>

      {/* 任务列表（可滚动+删除按钮） */}
      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
        {tasks.length > 0 ? (
          tasks.map(task => {
            const priority = getPriorityInfo(task.priority);
            return (
              <div 
                key={task.id} 
                className={`border rounded-lg p-4 flex justify-between items-center ${
                  task.completed ? 'bg-gray-50 opacity-70' : ''
                }`}
              >
                <div>
                  <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {task.category} · {task.subject} · 预估{task.estimatedTime}小时
                    {task.recommendedTime && ` · 推荐时间：${task.recommendedTime}`}
                  </p>
                  <p className={`text-xs ${task.deadline < getTodayPureDate() ? 'text-red-500' : 'text-gray-400'}`}>
                    截止：{task.deadline} · {priority.text}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={priority.color}>{priority.icon}</span>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                    className="h-5 w-5 rounded"
                  />
                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-10">
            暂无任务，点击上方添加任务吧！
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;