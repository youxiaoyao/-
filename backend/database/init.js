const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Maogo071019@',
  database: process.env.DB_NAME || 'task_schedule_db',
  ...(process.env.DB_SSL === 'true' ? { ssl: {} } : {}),
};

class MysqlPool {
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params = []) {
    // 移除 RETURNING 子句（MySQL 不支持），通过 insertId 返回
    let returningCol = null;
    const match = sql.match(/\s+RETURNING\s+(\w+)/i);
    if (match) {
      returningCol = match[1];
      sql = sql.replace(/\s+RETURNING\s+\w+/i, '');
    }

    const [result] = await this.pool.execute(sql, params);

    // INSERT/UPDATE/DELETE → ResultSetHeader（有 affectedRows）
    if (result && typeof result.affectedRows === 'number') {
      const rows = [];
      if (returningCol && typeof result.insertId === 'number' && result.insertId > 0) {
        const row = {};
        row[returningCol] = result.insertId;
        rows.push(row);
      }
      return { rows, rowCount: result.affectedRows };
    }

    // SELECT → RowDataPacket[]
    return { rows: result, rowCount: Array.isArray(result) ? result.length : 0 };
  }
}

async function initDatabase() {
  const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // 测试连接
  const conn = await pool.getConnection();
  console.log(`MySQL connected: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  conn.release();

  // 建表
  await pool.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    duration INT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    deadline DATE,
    is_completed TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    teacher VARCHAR(50) DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    week VARCHAR(50) DEFAULT '第1-16周',
    weekday VARCHAR(20) DEFAULT '周一',
    time VARCHAR(50) DEFAULT '08:00-09:40',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 插入默认数据（仅在用户表为空时）
  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM users');
  if (rows[0].count === 0) {
    console.log('Inserting initial data...');
    await pool.execute("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', '123456']);
    await pool.execute("INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '完成Python作业', 'Python', 120, 'high', '2024-12-31', 0]);
    await pool.execute("INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '复习数据结构', '数据结构', 90, 'medium', '2024-12-28', 1]);
    await pool.execute("INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '英语四级准备', '英语', 60, 'low', '2024-12-25', 0]);
    await pool.execute("INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '高等数学', '张老师', '教学楼A301', '第1-16周', '周一', '08:00-09:40']);
    await pool.execute("INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '大学英语', '李老师', '教学楼B202', '第1-16周', '周二', '10:00-11:40']);
    await pool.execute("INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, 'Python编程', '王老师', '实验楼C101', '第1-16周', '周三', '14:00-15:40']);
    await pool.execute("INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '数据结构', '赵老师', '教学楼A401', '第1-16周', '周四', '08:00-09:40']);
    await pool.execute("INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [1, '计算机网络', '刘老师', '实验楼C202', '第1-16周', '周五', '10:00-11:40']);
  }

  return new MysqlPool(pool);
}

module.exports = { initDatabase };
