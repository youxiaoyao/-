import React, { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Schedule } from '../types';
import { formatPureDate, getTodayPureDate } from '../utils/dateUtils';
import { authGet, authPost, authPatch, authDelete } from '../api/fetchUtils';

type Priority = 'high' | 'medium' | 'low';
type Category = '学习' | '生活' | '娱乐';

// 从后端获取所有任务（替换原localStorage读取）
const getTasks = async (): Promise<(Task & { recommendedTime?: string })[]> => {
  try {
    const data = await authGet('/tasks');
    // 后端字段映射到前端（核心修复：统一日期格式）
    return data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name || '',
      category: item.subject ? '学习' : '生活',
      subject: item.subject || '',
      estimatedTime: item.duration ? item.duration / 60 : 1, // 后端分钟转小时
      deadline: formatPureDate(item.deadline), // 核心修复：格式化日期，去除时区
      priority: item.priority || 'medium',
      completed: item.is_completed || false,
      recommendedTime: '' // 后端暂未存储，留空
    }));
  } catch (err) {
    console.error('【后端接口异常】获取任务失败：', err);
    alert('获取任务数据失败，暂显示本地数据！');
    // 降级处理：读取本地数据
    return JSON.parse(localStorage.getItem('tasks') || '[]');
  }
};

// 新增任务到后端（替换原localStorage保存）
const addTaskToBackend = async (task: Omit<Task, 'id' | 'completed'> & { recommendedTime?: string }) => {
  try {
    const taskToBackend = {
      name: task.name,
      subject: task.subject,
      duration: task.estimatedTime * 60, // 前端小时转后端分钟
      priority: task.priority,
      deadline: formatPureDate(task.deadline), // 核心修复：传递纯日期
      is_completed: false
    };
    const data = await authPost('/tasks', taskToBackend);
    if (data.code !== 200) {
      throw new Error('新增任务失败');
    }
    return data.id;
  } catch (err) {
    console.error('【后端接口异常】新增任务失败：', err);
    alert('新增任务失败，暂保存到本地！');
    // 降级处理：保存到本地
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const newTask = { id: uuidv4(), ...task, completed: false };
    allTasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(allTasks));
    throw err;
  }
};

// 更新任务状态到后端（替换原localStorage保存）
const updateTaskStatusToBackend = async (taskId: string, completed: boolean) => {
  try {
    const data = await authPatch(`/tasks/${taskId}`, { is_completed: completed });
    if (data.code !== 200) {
      throw new Error('更新任务状态失败');
    }
  } catch (err) {
    console.error('【后端接口异常】更新任务状态失败：', err);
    alert('更新任务状态失败，暂更新本地数据！');
    // 降级处理：更新本地数据
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = allTasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: completed } : t
    );
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    throw err;
  }
};

// 删除任务到后端（替换原localStorage保存）
const deleteTaskFromBackend = async (taskId: string) => {
  try {
    const data = await authDelete(`/tasks/${taskId}`);
    if (data.code !== 200) {
      throw new Error('删除任务失败');
    }
  } catch (err) {
    console.error('【后端接口异常】删除任务失败：', err);
    alert('删除任务失败，暂删除本地数据！');
    // 降级处理：删除本地数据
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = allTasks.filter((t: any) => t.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    throw err;
  }
};

// 从后端获取本周课表（替换原scheduleUtils）
const getWeekSchedules = async (): Promise<Record<string, Schedule[]>> => {
  try {
    const data = await authGet('/schedules');
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekSchedules: Record<string, Schedule[]> = {};
    
    // 初始化空课表
    weekDays.forEach(day => weekSchedules[day] = []);
    
    // 映射后端数据到前端
    data.data.forEach((item: any) => {
      const day = item.weekday || '周一';
      if (!weekSchedules[day]) weekSchedules[day] = [];
      weekSchedules[day].push({
        id: item.id.toString(),
        name: item.name || '',
        teacher: item.teacher || '',
        location: item.location || '',
        weekRange: item.week || '第1-16周',
        day: item.weekday || '周一',
        startTime: item.time ? item.time.split('-')[0] : '08:00',
        endTime: item.time ? item.time.split('-')[1] : '09:40'
      });
    });
    
    return weekSchedules;
  } catch (err) {
    console.error('【后端接口异常】获取课表失败：', err);
    alert('获取课表失败，暂显示本地数据！');
    // 降级处理：返回空课表
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekSchedules: Record<string, Schedule[]> = {};
    weekDays.forEach(day => weekSchedules[day] = []);
    return weekSchedules;
  }
};

// 优先级映射（与TaskManagement保持一致）
const getPriorityInfo = (priority: Priority) => {
  const map = {
    high: { text: '高优先级', color: 'text-red-500', icon: '🔴' },
    medium: { text: '中优先级', color: 'text-yellow-500', icon: '🟡' },
    low: { text: '低优先级', color: 'text-green-500', icon: '🟢' },
  };
  return map[priority];
};

// 获取今日任务（同步TaskManagement的排序逻辑）
const getTodayTasks = async (): Promise<(Task & { recommendedTime?: string })[]> => {
  const allTasks = await getTasks();
  const today = getTodayPureDate(); // 核心修复：使用本地纯日期
  // 修复：兼容后端返回的日期格式（统一为YYYY-MM-DD）
  return allTasks
    .filter(task => formatPureDate(task.deadline) === today) // 核心修复：统一日期对比
    .sort((a, b) => {
      // 1. 未完成在前
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // 2. 截止日期近在前
      if (a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
      // 3. 优先级高在前
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority as Priority] - priorityOrder[b.priority as Priority];
    });
};

// 计算本周学习时长（基于后端任务数据）
const calculateWeeklyHours = async (): Promise<number[]> => {
  const allTasks = await getTasks();
  const weekly = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日
  
  allTasks.forEach(task => {
    if (!task.completed) return;
    const taskDate = new Date(task.deadline);
    if (isNaN(taskDate.getTime())) return;
    const taskDay = taskDate.getDay();
    const idx = taskDay === 0 ? 6 : taskDay - 1; // 周日对应索引6
    weekly[idx] += task.estimatedTime;
  });
  
  return weekly;
};

const Dashboard: React.FC = () => {
  const [todayTasks, setTodayTasks] = useState<(Task & { recommendedTime?: string })[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<Record<string, Schedule[]>>({});
  const [completionRate, setCompletionRate] = useState(0);
  const [estimatedTotalTime, setEstimatedTotalTime] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 新增任务表单（移除难度字段）
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'completed'>>({
    name: '',
    category: '学习' as Category,
    subject: '',
    estimatedTime: 1,
    deadline: getTodayPureDate(), // 核心修复：初始化为本日纯日期
    priority: 'medium' as Priority,
  });

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 初始化数据（异步从后端获取）
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // 今日任务
        const tasks = await getTodayTasks();
        setTodayTasks(tasks);

        // 完成率
        const completed = tasks.filter(t => t.completed).length;
        setCompletionRate(tasks.length ? Math.round((completed / tasks.length) * 100) : 0);

        // 预估总时长
        setEstimatedTotalTime(tasks.reduce((sum, t) => sum + t.estimatedTime, 0));

        // 本周课表
        const schedules = await getWeekSchedules();
        setWeekSchedules(schedules);

        // 本周学习时长
        const weekly = await calculateWeeklyHours();
        setWeeklyHours(weekly);
      } catch (err) {
        console.error('初始化数据失败：', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 刷新今日任务数据（复用逻辑）
  const refreshTodayTasks = useCallback(async () => {
    try {
      // 1. 获取最新今日任务
      const tasks = await getTodayTasks();
      setTodayTasks(tasks);
      
      // 2. 更新完成率
      const completed = tasks.filter(t => t.completed).length;
      setCompletionRate(tasks.length ? Math.round((completed / tasks.length) * 100) : 0);
      
      // 3. 更新预估总时长
      setEstimatedTotalTime(tasks.reduce((sum, t) => sum + t.estimatedTime, 0));
      
      // 4. 更新本周学习时长
      const weekly = await calculateWeeklyHours();
      setWeeklyHours(weekly);
    } catch (err) {
      console.error('刷新任务数据失败：', err);
    }
  }, []);

  // 添加任务（对接后端接口）
  const handleAddTask = useCallback(async () => {
    if (!newTask.name?.trim() || !newTask.subject?.trim()) {
      setErrorMsg('请填写任务名称和学科！');
      return;
    }
    setErrorMsg('');

    try {
      // 推荐时间逻辑（简化版）
      const getRecommendedTime = () => {
        // const pref = JSON.parse(localStorage.getItem('preferences') || JSON.stringify({ sleepTime: '23:30', wakeUpTime: '07:00' }));
        return '08:00-09:00'; // 简化推荐
      };

      // 1. 新增任务到后端
      await addTaskToBackend({
        ...newTask,
        recommendedTime: getRecommendedTime()
      });

      // 2. 重置表单+关闭弹窗
      setNewTask({
        name: '',
        subject: '',
        category: '学习',
        estimatedTime: 1,
        deadline: getTodayPureDate(), // 核心修复：重置为本日纯日期
        priority: 'medium',
      });
      setShowAddTask(false);
      
      // 3. 核心修复：先等待后端写入完成，再刷新数据
      await new Promise(resolve => setTimeout(resolve, 300)); // 短暂等待确保数据落地
      await refreshTodayTasks(); // 只执行一次刷新
      
      alert('新增任务成功！');
    } catch (err) {
      console.error('添加任务失败：', err);
      alert('新增任务失败，请重试！');
    }
  }, [newTask, refreshTodayTasks]);

  // 切换任务完成状态（对接后端接口）
  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    try {
      // 找到当前任务状态
      const task = todayTasks.find(t => t.id === taskId);
      if (!task) return;
      
      // 更新后端状态
      await updateTaskStatusToBackend(taskId, !task.completed);
      
      // 刷新数据
      await refreshTodayTasks();
    } catch (err) {
      console.error('切换任务状态失败：', err);
    }
  }, [todayTasks, refreshTodayTasks]);

  // 删除任务（对接后端接口）
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      // 删除后端任务
      await deleteTaskFromBackend(taskId);
      
      // 刷新数据
      await refreshTodayTasks();
      alert('删除任务成功！');
    } catch (err) {
      console.error('删除任务失败：', err);
      alert('删除任务失败，请重试！');
    }
  }, [refreshTodayTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px] w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      {/* 顶部统计 */}
      <div className="flex justify-end gap-4 mb-6">
        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm text-gray-500">今日任务</div>
          <div className="text-xl font-bold">{todayTasks.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm text-gray-500">完成率</div>
          <div className="text-xl font-bold">{completionRate}%</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
          <div className="text-sm text-gray-500">预估学习时长</div>
          <div className="text-xl font-bold">{estimatedTotalTime}h</div>
        </div>
      </div>

      {/* 主体内容：今日任务 + 本周课表 + 本周效率 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 今日任务 */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm p-4 h-[600px] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">今日任务</h3>
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <span>+</span> 添加任务
            </button>
          </div>

          {/* 新增任务弹窗 */}
          {showAddTask && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              {errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">任务名称</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="输入任务名称"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">学科</label>
                  <input
                    type="text"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="输入学科名称"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">预估时长（小时）</label>
                  <input
                    type="number"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask({ ...newTask, estimatedTime: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    min={0.5}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">分类</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as Category })}
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
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
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
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddTask}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  确认添加
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 今日任务列表 */}
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map(task => {
                const priority = getPriorityInfo(task.priority as Priority);
                return (
                  <div key={task.id} className="border rounded-lg p-3 flex justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskCompletion(task.id)}
                          className="rounded"
                        />
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>
                          {task.name}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {task.category} · {task.subject}
                        {task.recommendedTime && ` · 推荐时间：${task.recommendedTime}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        预计 {task.estimatedTime} 小时 · 截止 {task.deadline}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 优先级按钮颜色与TaskManagement一致 */}
                      <span className={priority.color}>{priority.icon}</span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 py-10">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-lg mb-1">今日暂无任务</div>
              <div className="text-sm">点击「添加任务」开始规划你的一天吧</div>
            </div>
          )}
        </div>

        {/* 右侧面板：本周课表 + 本周效率 */}
        <div className="col-span-1 space-y-6">
          {/* 本周课表 */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-[300px] overflow-auto">
            <h3 className="font-semibold text-lg mb-4">本周课表</h3>
            {Object.entries(weekSchedules).map(([day, schedules]) => (
              <div key={day} className="mb-3">
                <div className="font-medium text-sm mb-1">{day}</div>
                {schedules.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="border rounded p-1">
                        <div>{schedule.name}</div>
                        <div className="text-xs text-gray-500">
                          {schedule.startTime}-{schedule.endTime} · {schedule.location}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">今日无课</div>
                )}
              </div>
            ))}
          </div>

          {/* 本周效率分析 */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-[280px]">
            <h3 className="font-semibold text-lg mb-4">本周效率分析</h3>
            <div className="h-[200px] relative">
              <svg width="100%" height="100%" viewBox="0 0 300 200" className="absolute">
                {/* 坐标轴 */}
                <line x1="20" y1="180" x2="280" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="20" y1="40" x2="20" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* 柱状图 */}
                {weeklyHours.map((hours, index) => {
                  const x = 20 + (index * 35);
                  const height = hours * 20;
                  const y = 180 - height;
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={y}
                      width="25"
                      height={height > 0 ? height : 0}
                      fill="#818cf8"
                      rx="4"
                    />
                  );
                })}

                {/* 数值标签 */}
                {weeklyHours.map((hours, index) => {
                  if (hours <= 0) return null;
                  const x = 20 + (index * 35) + 12.5;
                  const y = 180 - (hours * 20) - 10;
                  return (
                    <text
                      key={index}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#1f2937"
                    >
                      {hours}h
                    </text>
                  );
                })}

                {/* 星期标签 */}
                {weekDays.map((day, index) => {
                  const x = 20 + (index * 35) + 12.5;
                  return (
                    <text
                      key={index}
                      x={x}
                      y={195}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {day}
                    </text>
                  );
                })}

                {/* 时长标签 */}
                <text x="10" y="40" fontSize="10" fill="#9ca3af">8h</text>
                <text x="10" y="80" fontSize="10" fill="#9ca3af">6h</text>
                <text x="10" y="120" fontSize="10" fill="#9ca3af">4h</text>
                <text x="10" y="160" fontSize="10" fill="#9ca3af">2h</text>
                <text x="10" y="185" fontSize="10" fill="#9ca3af">0h</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;