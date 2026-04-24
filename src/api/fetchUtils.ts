// 统一的 fetch API 封装，自动添加认证头
const API_BASE_URL = '/api';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 统一的 GET 请求
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  const data = await response.json();

  if (data.code === 401) {
    // Token 过期或无效，清除本地存储并跳转登录
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
    throw new Error('认证失败，请重新登录');
  }

  return data;
};

// 简化的 GET 请求
export const authGet = (url: string) => authFetch(url);

// 简化的 POST 请求
export const authPost = (url: string, body: any) => authFetch(url, {
  method: 'POST',
  body: JSON.stringify(body)
});

// 简化的 PATCH 请求
export const authPatch = (url: string, body: any) => authFetch(url, {
  method: 'PATCH',
  body: JSON.stringify(body)
});

// 简化的 DELETE 请求
export const authDelete = (url: string) => authFetch(url, {
  method: 'DELETE'
});