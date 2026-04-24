import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login'; // 导入登录组件
import Register from './components/Register'; // 新增：导入注册组件
import Dashboard from './components/Dashboard';
import TaskManagement from './components/TaskManagement';
import ScheduleManagement from './components/ScheduleManagement';
import EfficiencyAnalysis from './components/EfficiencyAnalysis';

// 核心：验证是否登录（通过localStorage的token判断）
const isLogin = () => {
  return !!localStorage.getItem('token');
};

// 受保护的路由组件（未登录则跳登录页）
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLogin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState('');

  // 实时更新日期时间（每秒刷新）
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const weekDay = weekDays[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${year}年${month}月${day}日 ${weekDay} ${hours}:${minutes}:${seconds}`);
    };
    updateTime(); // 初始化
    const timer = setInterval(updateTime, 1000); // 每秒更新
    return () => clearInterval(timer); // 清除定时器
  }, []);

  // 退出登录功能
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login'; // 跳登录页
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页路由（无需登录） */}
        <Route path="/login" element={<Login />} />
        {/* 新增：注册页路由（无需登录） */}
        <Route path="/register" element={<Register />} />
        
        {/* 系统主页面路由（需要登录） */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                {/* 顶部导航（新增退出登录按钮） */}
                <header className="bg-white shadow-sm px-8 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 text-xl">⏰</span>
                      <h1 className="text-xl font-bold text-gray-800">时间管理智能体</h1>
                    </div>
                    {/* 登录后显示用户名+退出按钮 */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        欢迎：{localStorage.getItem('username') || '用户'}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </header>

                {/* 主体内容 */}
                <main className="px-8 py-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">你好，大学生！</h2>
                    <p className="text-gray-500 mt-1">{currentTime}</p>
                  </div>

                  {/* 标签页导航（保留原有逻辑） */}
                  <div className="flex gap-1 mb-6 border-b">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-4 py-2 rounded-t-lg font-medium ${
                        activeTab === 'dashboard'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      仪表盘
                    </button>
                    <button
                      onClick={() => setActiveTab('task')}
                      className={`px-4 py-2 rounded-t-lg font-medium ${
                        activeTab === 'task'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      任务管理
                    </button>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`px-4 py-2 rounded-t-lg font-medium ${
                        activeTab === 'schedule'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      课表
                    </button>
                    <button
                      onClick={() => setActiveTab('efficiency')}
                      className={`px-4 py-2 rounded-t-lg font-medium ${
                        activeTab === 'efficiency'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      效率分析
                    </button>
                  </div>

                  {/* 标签页内容（保留原有逻辑） */}
                  <div>
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'task' && <TaskManagement />}
                    {activeTab === 'schedule' && <ScheduleManagement />}
                    {activeTab === 'efficiency' && <EfficiencyAnalysis />}
                  </div>
                </main>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* 兜底路由：未匹配的路径跳登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;