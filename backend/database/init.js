const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/app.db');

// 确保data目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据库
function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('已连接到SQLite数据库');

            // 创建表
            createTables(db)
                .then(() => {
                    console.log('数据库表创建成功');
                    // 插入初始数据
                    return insertInitialData(db);
                })
                .then(() => {
                    console.log('初始数据插入完成');
                    resolve(db);
                })
                .catch(reject);
        });
    });
}

// 创建数据表
function createTables(db) {
    return new Promise((resolve, reject) => {
        const queries = [
            // 用户表
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // 任务表
            `CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                subject TEXT,
                duration INTEGER, -- 分钟
                priority TEXT DEFAULT 'medium',
                deadline DATE,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // 课程表
            `CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                teacher TEXT,
                location TEXT,
                week TEXT, -- 第1-16周
                weekday TEXT, -- 周一、周二等
                time TEXT, -- 08:00-09:40
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`
        ];

        let completed = 0;
        if (queries.length === 0) {
            resolve();
            return;
        }

        queries.forEach((query, index) => {
            db.run(query, (err) => {
                if (err) {
                    console.error(`创建表失败 (${index}):`, err.message);
                    reject(err);
                    return;
                }
                completed++;
                if (completed === queries.length) {
                    resolve();
                }
            });
        });
    });
}

// 插入初始数据
function insertInitialData(db) {
    return new Promise((resolve, reject) => {
        // 检查是否已有数据
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row.count === 0) {
                console.log('插入初始数据...');

                // 插入默认用户
                const insertUser = `INSERT INTO users (username, password) VALUES (?, ?)`;
                db.run(insertUser, ['admin', '123456'], function(err) {
                    if (err) {
                        console.error('插入用户失败:', err.message);
                        reject(err);
                        return;
                    }

                    const userId = this.lastID;

                    // 插入示例任务
                    const insertTasks = `INSERT INTO tasks
                        (user_id, name, subject, duration, priority, deadline, is_completed)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

                    const tasks = [
                        [userId, '完成Python作业', 'Python', 120, 'high', '2024-12-31', 0],
                        [userId, '复习数据结构', '数据结构', 90, 'medium', '2024-12-28', 1],
                        [userId, '英语四级准备', '英语', 60, 'low', '2024-12-25', 0]
                    ];

                    let taskCompleted = 0;
                    tasks.forEach(task => {
                        db.run(insertTasks, task, (err) => {
                            if (err) {
                                console.error('插入任务失败:', err.message);
                            }
                            taskCompleted++;
                            if (taskCompleted === tasks.length) {
                                insertSchedules(db, userId, resolve, reject);
                            }
                        });
                    });
                });
            } else {
                resolve();
            }
        });
    });
}

// 插入示例课程
function insertSchedules(db, userId, resolve, reject) {
    const insertSchedule = `INSERT INTO schedules
        (user_id, name, teacher, location, week, weekday, time)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const schedules = [
        [userId, '高等数学', '张老师', '教学楼A301', '第1-16周', '周一', '08:00-09:40'],
        [userId, '大学英语', '李老师', '教学楼B202', '第1-16周', '周二', '10:00-11:40'],
        [userId, 'Python编程', '王老师', '实验楼C101', '第1-16周', '周三', '14:00-15:40'],
        [userId, '数据结构', '赵老师', '教学楼A401', '第1-16周', '周四', '08:00-09:40'],
        [userId, '计算机网络', '刘老师', '实验楼C202', '第1-16周', '周五', '10:00-11:40']
    ];

    let scheduleCompleted = 0;
    schedules.forEach(schedule => {
        db.run(insertSchedule, schedule, (err) => {
            if (err) {
                console.error('插入课程失败:', err.message);
            }
            scheduleCompleted++;
            if (scheduleCompleted === schedules.length) {
                console.log('初始数据插入完成');
                resolve();
            }
        });
    });
}

module.exports = {
    initDatabase,
    dbPath
};