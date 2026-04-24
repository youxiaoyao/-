# 大学生时间管理系统

一个功能完整的大学生时间管理系统，支持任务管理、课程安排、效率分析等功能。

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Node.js + HTTP Server
- **状态管理**: React Hooks + localStorage
- **HTTP客户端**: Axios + Fetch API

## 项目结构

```
14组-大学生时间管理系统/
├── src/                    # 前端源代码
│   ├── api/              # API接口封装
│   ├── components/       # React组件
│   ├── types/           # TypeScript类型定义
│   └── utils/           # 工具函数
├── backend/             # 后端服务
│   ├── server.js        # Node.js服务器
│   └── package.json     # 后端依赖配置
├── public/              # 静态资源
└── package.json         # 前端依赖配置
```

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 2. 启动开发环境

#### 方式一：分别启动

```bash
# 终端1：启动前端开发服务器
npm run dev

# 终端2：启动后端服务器
npm run backend
```

#### 方式二：同时启动（推荐）

```bash
npm run dev:full
```

### 3. 访问应用

- 前端应用: http://localhost:5185
- 后端API: http://localhost:3003

## 默认账户

系统预置了一个测试账户：
- **用户名**: admin
- **密码**: 123456

## 主要功能

### 1. 用户认证
- 登录/注册功能
- Token-based身份验证

### 2. 仪表盘
- 今日任务概览
- 完成率统计
- 预估学习时长
- 本周课表显示
- 效率分析图表

### 3. 任务管理
- 任务增删改查
- 优先级管理（高/中/低）
- 智能时间推荐
- 任务完成状态跟踪

### 4. 课表管理
- 课程增删改查
- 课程时间冲突检测
- 可视化课表展示

### 5. 效率分析
- 学习时长统计
- 可视化图表展示
- 周效率趋势分析

## API接口

### 认证接口
- `POST /api/login` - 用户登录
- `POST /api/register` - 用户注册

### 任务接口
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PATCH /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 课表接口
- `GET /api/schedules` - 获取课表
- `POST /api/schedules` - 添加课程
- `DELETE /api/schedules/:id` - 删除课程

## 数据模型

### Task（任务）
```typescript
interface Task {
  id: string;
  name: string;
  category: string;
  subject: string;
  estimatedTime: number;  // 小时
  deadline: string;       // YYYY-MM-DD格式
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  recommendedTime?: string;
}
```

### Schedule（课程）
```typescript
interface Schedule {
  id: string;
  name: string;
  teacher: string;
  location: string;
  weekRange: string;
  day: string;
  startTime: string;
  endTime: string;
}
```

## 开发说明

### 环境要求
- Node.js >= 14
- npm >= 6

### 配置文件
- `vite.config.ts` - 前端构建配置
- `tailwind.config.js` - Tailwind CSS配置
- `backend/server.js` - 后端服务器配置

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 注意事项

1. 后端使用内存存储，重启服务器会丢失数据
2. 前端有本地降级处理，后端不可用时仍可查看本地数据
3. 日期处理已统一为本地时区，避免时区问题
4. 所有API调用都有错误处理和降级机制

## 未来优化方向

1. 集成数据库（SQLite/MongoDB）
2. 实现真正的JWT认证
3. 添加数据持久化和同步
4. 优化UI/UX设计
5. 添加更多统计分析功能

## 许可证

MIT License

## 作者

14组 - 大学生时间管理系统开发团队