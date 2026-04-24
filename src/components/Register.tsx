import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = '/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPwd: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 注册提交
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!formData.username.trim()) {
      setErrorMsg('请输入用户名！');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('密码长度不能少于6位！');
      return;
    }
    if (formData.password !== formData.confirmPwd) {
      setErrorMsg('两次密码输入不一致！');
      return;
    }

    try {
      setLoading(true);
      // 调用后端注册接口
      const res = await fetch(`${API_BASE_URL}/register`, {
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
        setSuccessMsg('注册成功！即将跳转到登录页...');
        // 注册成功后跳登录页
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setErrorMsg(data.msg || '注册失败！');
      }
    } catch (err) {
      console.error('注册接口异常：', err);
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
            学习任务管理系统 - 注册
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            创建你的账号
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            {/* 提示信息 */}
            {errorMsg && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-600 px-4 py-2 rounded text-sm">
                {successMsg}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请设置用户名"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请设置密码（至少6位）"
                />
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPwd" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="mt-1">
                <input
                  id="confirmPwd"
                  name="confirmPwd"
                  type="password"
                  required
                  value={formData.confirmPwd}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请再次输入密码"
                />
              </div>
            </div>

            {/* 注册按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </div>

            {/* 登录入口 */}
            <div className="text-center text-sm text-gray-600">
              已有账号？{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                立即登录
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;