const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'data/app.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 开始SQLite数据库测试...');

// 测试用户表
db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
        console.error('❌ 用户表查询失败:', err.message);
        return;
    }
    console.log(`✅ 用户表: ${row.count} 条记录`);
});

// 测试任务表
db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
    if (err) {
        console.error('❌ 任务表查询失败:', err.message);
        return;
    }
    console.log(`✅ 任务表: ${row.count} 条记录`);
});

// 测试课程表
db.get("SELECT COUNT(*) as count FROM schedules", (err, row) => {
    if (err) {
        console.error('❌ 课程表查询失败:', err.message);
        return;
    }
    console.log(`✅ 课程表: ${row.count} 条记录`);

    // 关闭数据库连接
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('❌ 数据库关闭失败:', err.message);
                return;
            }
            console.log('✅ 数据库连接已关闭');
            console.log('🎉 SQLite迁移测试完成！');
        });
    }, 500);
});