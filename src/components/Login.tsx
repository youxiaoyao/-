import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 后端接口基础地址（和你的项目保持一致）
const API_BASE_URL = '/api';

const Login: React.FC = () => {
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: localStorage.getItem('remember') === 'true'
  });
  // 错误提示
  const [errorMsg, setErrorMsg] = useState('');
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 路由跳转
  const navigate = useNavigate();

  // 初始化：记住密码时填充用户名
  useEffect(() => {
    if (formData.remember) {
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        setFormData(prev => ({ ...prev, username: savedUsername }));
      }
    }
  }, []);

  // 表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  // 登录提交（对接后端接口）
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.username.trim()) {
      setErrorMsg('请输入用户名！');
      return;
    }
    if (!formData.password.trim()) {
      setErrorMsg('请输入密码！');
      return;
    }

    try {
      setLoading(true);
      // 调用后端登录接口
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await res.json();
      if (data.code === 200) {
        // 登录成功：存储token和用户名
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('username', formData.username);
        localStorage.setItem('remember', formData.remember ? 'true' : 'false');
        
        // 跳转到系统主页面（根路径）
        navigate('/');
      } else {
        setErrorMsg(data.msg || '登录失败，请检查用户名或密码！');
      }
    } catch (err) {
      console.error('登录接口异常：', err);
      setErrorMsg('服务器异常，请稍后重试！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            学习任务管理系统
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请登录你的账号
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  记住密码
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  忘记密码？
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              还没有账号？{' '}
              <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                立即注册
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;