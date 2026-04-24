import React, { useState, useEffect } from 'react';
import { Schedule } from '../types';

// 后端接口基础地址（和TaskManagement保持一致）
const API_BASE_URL = '/api';

// 从后端获取所有课程（替换原scheduleUtils的getAllSchedules）
const getAllSchedules = async (): Promise<Schedule[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    // 后端字段映射到前端（解决字段名不一致问题）
    return data.data.map((item: any) => ({
      id: item.id.toString(), // 后端id是数字 → 前端统一为字符串
      name: item.name || '',
      teacher: item.teacher || '',
      location: item.location || '',
      weekRange: item.week || '第1-16周', // 后端week → 前端weekRange
      day: item.weekday || '周一', // 后端weekday → 前端day
      startTime: item.time ? item.time.split('-')[0] : '08:00', // 后端time拆分出开始时间
      endTime: item.time ? item.time.split('-')[1] : '09:40', // 后端time拆分出结束时间
    }));
  } catch (err) {
    console.error('【后端接口异常】获取课表失败：', err);
    alert('获取课表失败，请检查后端是否启动！');
    return [];
  }
};

// 新增课程到后端（替换原scheduleUtils的addSchedule）
const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
  try {
    // 构造后端需要的参数格式
    const scheduleToBackend = {
      name: schedule.name,
      teacher: schedule.teacher,
      location: schedule.location,
      week: schedule.weekRange, // 前端weekRange → 后端week
      weekday: schedule.day, // 前端day → 后端weekday
      time: `${schedule.startTime}-${schedule.endTime}`, // 前端时间拼接成后端time字段
    };
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(scheduleToBackend),
    });
    const data = await res.json();
    if (data.code !== 200) {
      throw new Error('新增课程失败');
    }
    return data.id; // 返回新增课程的ID
  } catch (err) {
    console.error('【后端接口异常】新增课程失败：', err);
    alert('新增课程失败，请检查后端是否启动！');
    throw err;
  }
};

// 从后端删除课程（替换原scheduleUtils的deleteSchedule）
const deleteSchedule = async (id: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    if (data.code !== 200) {
      throw new Error('删除课程失败');
    }
  } catch (err) {
    console.error('【后端接口异常】删除课程失败：', err);
    alert('删除课程失败，请检查后端是否启动！');
    throw err;
  }
};

const ScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Omit<Schedule, 'id'>>({
    name: '',
    teacher: '',
    location: '',
    weekRange: '第1-16周',
    day: '周一',
    startTime: '08:00',
    endTime: '09:40',
  });

  // 初始化：从后端拉取所有课程（替换原直接调用getAllSchedules）
  useEffect(() => {
    const init = async () => {
      const initSchedules = await getAllSchedules();
      setSchedules(initSchedules);
    };
    init();
  }, []);

  // 新增课程（对接后端接口）
  const handleAddSchedule = async () => {
    if (!newSchedule.name.trim()) {
      alert('请输入课程名称！');
      return;
    }
    try {
      await addSchedule(newSchedule);
      // 新增成功后重新拉取最新课表
      const latestSchedules = await getAllSchedules();
      setSchedules(latestSchedules);
      // 重置表单（保留原逻辑）
      setNewSchedule({
        name: '',
        teacher: '',
        location: '',
        weekRange: '第1-16周',
        day: '周一',
        startTime: '08:00',
        endTime: '09:40',
      });
      alert('新增课程成功！');
    } catch (err) {
      // 错误已在addSchedule中处理，无需重复提示
    }
  };

  // 删除课程（对接后端接口）
  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      // 删除成功后重新拉取最新课表
      const latestSchedules = await getAllSchedules();
      setSchedules(latestSchedules);
      alert('删除课程成功！');
    } catch (err) {
      // 错误已在deleteSchedule中处理，无需重复提示
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-4">课表管理</h3>
      <div className="grid grid-cols-6 gap-2 mb-4">
        <input
          type="text"
          placeholder="输入课程名称"
          value={newSchedule.name}
          onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="输入老师姓名"
          value={newSchedule.teacher}
          onChange={(e) => setNewSchedule({ ...newSchedule, teacher: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="输入上课地点"
          value={newSchedule.location}
          onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          value={newSchedule.weekRange}
          onChange={(e) => setNewSchedule({ ...newSchedule, weekRange: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <select
          value={newSchedule.day}
          onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
          className="border rounded px-2 py-1"
        >
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <div className="flex gap-1">
          <input
            type="time"
            value={newSchedule.startTime}
            onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="time"
            value={newSchedule.endTime}
            onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
      <button
        onClick={handleAddSchedule}
        className="bg-indigo-600 text-white px-3 py-1 rounded mb-4"
      >
        添加课程
      </button>

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="border rounded p-2 flex justify-between items-center">
            <div>
              <div className="font-medium">{schedule.name}</div>
              <div className="text-sm text-gray-500">
                老师：{schedule.teacher} · 地点：{schedule.location} · 周数：{schedule.weekRange}
              </div>
              <div className="text-xs text-gray-400">
                {schedule.day} · {schedule.startTime}-{schedule.endTime}
              </div>
            </div>
            <button
              onClick={() => handleDeleteSchedule(schedule.id)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleManager;