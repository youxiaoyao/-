const { Pool } = require('pg');
const dns = require('dns');

// 从环境变量获取数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('错误: 未设置 DATABASE_URL 环境变量');
    process.exit(1);
}

// 解析 DATABASE_URL 获取主机名
const url = require('url');
const parsedUrl = url.parse(DATABASE_URL);
const hostname = parsedUrl.hostname;

// 强制解析为 IPv4 地址
async function getIPv4Address(host) {
    return new Promise((resolve, reject) => {
        dns.lookup(host, { family: 4 }, (err, address) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(address);
        });
    });
}

// 创建数据库连接池
async function createPool() {
    try {
        const ipv4Address = await getIPv4Address(hostname);
        console.log(`解析到 IPv4 地址: ${ipv4Address}`);
        
        // 替换 URL 中的主机名为 IPv4 地址
        const newUrl = DATABASE_URL.replace(hostname, ipv4Address);
        
        return new Pool({
            connectionString: newUrl,
            ssl: {
                rejectUnauthorized: false
            }
        });
    } catch (err) {
        console.error('解析 IPv4 地址失败:', err);
        process.exit(1);
    }
}

let pool = null;

// 初始化数据库
async function initDatabase() {
    try {
        // 创建连接池（强制 IPv4）
        pool = await createPool();
        
        // 测试连接
        const client = await pool.connect();
        console.log('已连接到PostgreSQL数据库');
        
        // 创建表
        await createTables(client);
        console.log('数据库表创建成功');
        
        // 插入初始数据
        await insertInitialData(client);
        console.log('初始数据插入完成');
        
        client.release();
        return pool;
    } catch (err) {
        console.error('数据库初始化失败:', err);
        process.exit(1);
    }
}

// 创建数据表
async function createTables(client) {
    const queries = [
        // 用户表
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // 任务表
        `CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            name TEXT NOT NULL,
            subject TEXT,
            duration INTEGER,
            priority TEXT DEFAULT 'medium',
            deadline DATE,
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`,

        // 课程表
        `CREATE TABLE IF NOT EXISTS schedules (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            name TEXT NOT NULL,
            teacher TEXT,
            location TEXT,
            week TEXT,
            weekday TEXT,
            time TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`
    ];

    for (const query of queries) {
        await client.query(query);
    }
}

// 插入初始数据
async function insertInitialData(client) {
    const result = await client.query("SELECT COUNT(*) as count FROM users");
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
        console.log('插入初始数据...');

        // 插入默认用户
        const userResult = await client.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            ['admin', '123456']
        );
        const userId = userResult.rows[0].id;

        // 插入示例任务
        const tasks = [
            [userId, '完成Python作业', 'Python', 120, 'high', '2024-12-31', false],
            [userId, '复习数据结构', '数据结构', 90, 'medium', '2024-12-28', true],
            [userId, '英语四级准备', '英语', 60, 'low', '2024-12-25', false]
        ];

        for (const task of tasks) {
            await client.query(
                `INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                task
            );
        }

        // 插入示例课程
        const schedules = [
            [userId, '高等数学', '张老师', '教学楼A301', '第1-16周', '周一', '08:00-09:40'],
            [userId, '大学英语', '李老师', '教学楼B202', '第1-16周', '周二', '10:00-11:40'],
            [userId, 'Python编程', '王老师', '实验楼C101', '第1-16周', '周三', '14:00-15:40'],
            [userId, '数据结构', '赵老师', '教学楼A401', '第1-16周', '周四', '08:00-09:40'],
            [userId, '计算机网络', '刘老师', '实验楼C202', '第1-16周', '周五', '10:00-11:40']
        ];

        for (const schedule of schedules) {
            await client.query(
                `INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                schedule
            );
        }

        console.log('初始数据插入完成');
    }
}

module.exports = {
    initDatabase,
    pool
};