const http = require("http");
const url = require("url");
const path = require("path");

// 导入数据库和DAO
const { initDatabase } = require('./database/init');
const UserDAO = require('./dao/UserDAO');
const TaskDAO = require('./dao/TaskDAO');
const ScheduleDAO = require('./dao/ScheduleDAO');

// 全局数据库对象
let db;
let userDAO;
let taskDAO;
let scheduleDAO;

function generateToken(username) {
  // 简单的token生成，实际项目中应该使用JWT
  return "token_" + Date.now() + "_" + username + "_" + Math.random().toString(36).substr(2);
}

function verifyToken(token) {
  // 简单的token验证，实际项目中应该验证JWT签名
  return token && token.startsWith("token_");
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

async function handleLogin(req, res, body) {
  const { username, password } = body;

  try {
    const user = await userDAO.validateUser(username, password);
    if (user) {
      const token = generateToken(username);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 200, msg: "登录成功", token, username }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 401, msg: "用户名或密码错误" }));
    }
  } catch (error) {
    console.error('登录错误:', error);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 500, msg: "服务器内部错误" }));
  }
}

async function handleRegister(req, res, body) {
  const { username, password } = body;

  if (!username || !password) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 400, msg: "用户名和密码不能为空" }));
    return;
  }

  try {
    await userDAO.createUser(username, password);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 200, msg: "注册成功" }));
  } catch (error) {
    console.error('注册错误:', error);
    if (error.message === '用户名已存在') {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 400, msg: "用户名已存在" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 500, msg: "服务器内部错误" }));
    }
  }
}

async function handleTasks(req, res, method, body) {
  try {
    switch (method) {
      case "GET":
        const tasks = await taskDAO.getAllTasks();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "success", data: tasks }));
        break;
      case "POST":
        const newTask = await taskDAO.createTask({
          name: body.name || "",
          subject: body.subject || "",
          duration: body.duration || 60,
          priority: body.priority || "medium",
          deadline: body.deadline || new Date().toISOString().split("T")[0],
          is_completed: body.is_completed || false
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "新增任务成功", id: newTask.id }));
        break;
      case "PATCH":
        const taskId = parseInt(req.url.split("/")[3]);
        await taskDAO.updateTask(taskId, body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "更新任务成功" }));
        break;
      case "DELETE":
        const deleteTaskId = parseInt(req.url.split("/")[3]);
        await taskDAO.deleteTask(deleteTaskId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "删除任务成功" }));
        break;
      default:
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 405, msg: "Method not allowed" }));
    }
  } catch (error) {
    console.error('任务操作错误:', error);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 500, msg: "服务器内部错误" }));
  }
}

async function handleSchedules(req, res, method, body) {
  try {
    switch (method) {
      case "GET":
        const schedules = await scheduleDAO.getAllSchedules();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "success", data: schedules }));
        break;
      case "POST":
        const newSchedule = await scheduleDAO.createSchedule({
          name: body.name || "",
          teacher: body.teacher || "",
          location: body.location || "",
          week: body.week || "第1-16周",
          weekday: body.weekday || "周一",
          time: body.time || "08:00-09:40"
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "新增课程成功", id: newSchedule.id }));
        break;
      case "DELETE":
        const deleteScheduleId = parseInt(req.url.split("/")[3]);
        await scheduleDAO.deleteSchedule(deleteScheduleId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 200, msg: "删除课程成功" }));
        break;
      default:
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 405, msg: "Method not allowed" }));
    }
  } catch (error) {
    console.error('课程操作错误:', error);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 500, msg: "服务器内部错误" }));
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const body = await parseBody(req);
  
  if (pathname === "/api/login" && req.method === "POST") {
    handleLogin(req, res, body);
  } else if (pathname === "/api/register" && req.method === "POST") {
    handleRegister(req, res, body);
  } else if (pathname.startsWith("/api/tasks")) {
    // 验证token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!verifyToken(token)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 401, msg: "认证失败" }));
      return;
    }
    handleTasks(req, res, req.method, body);
  } else if (pathname.startsWith("/api/schedules")) {
    // 验证token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!verifyToken(token)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 401, msg: "认证失败" }));
      return;
    }
    handleSchedules(req, res, req.method, body);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 404, msg: "Not found" }));
  }
});

// 初始化数据库并启动服务器
initDatabase()
  .then(database => {
    db = database;
    userDAO = new UserDAO(db);
    taskDAO = new TaskDAO(db);
    scheduleDAO = new ScheduleDAO(db);

    const PORT = 3004;
    server.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log('SQLite database connected successfully');
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });