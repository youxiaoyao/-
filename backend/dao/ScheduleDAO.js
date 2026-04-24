class ScheduleDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有课程
    async getAllSchedules(userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
    }

    // 创建新课程
    async createSchedule(scheduleData, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    scheduleData.name,
                    scheduleData.teacher,
                    scheduleData.location,
                    scheduleData.week,
                    scheduleData.weekday,
                    scheduleData.time
                ],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ id: this.lastID, ...scheduleData });
                }
            );
        });
    }

    // 删除课程
    async deleteSchedule(scheduleId, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM schedules WHERE id = ? AND user_id = ?',
                [scheduleId, userId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    // 根据ID获取课程
    async getScheduleById(scheduleId, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM schedules WHERE id = ? AND user_id = ?',
                [scheduleId, userId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                }
            );
        });
    }

    // 检查时间冲突
    async checkTimeConflict(weekday, time, excludeId = null, userId = 1) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM schedules WHERE user_id = ? AND weekday = ? AND time = ?';
            const params = [userId, weekday, time];

            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(!!row);
            });
        });
    }
}

module.exports = ScheduleDAO;