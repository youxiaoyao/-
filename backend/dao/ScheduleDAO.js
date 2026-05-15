class ScheduleDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有课程
    async getAllSchedules(userId) {
        const result = await this.db.query(
            'SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // 创建新课程
    async createSchedule(scheduleData, userId) {
        const result = await this.db.query(
            `INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time)
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                userId,
                scheduleData.name,
                scheduleData.teacher,
                scheduleData.location,
                scheduleData.week,
                scheduleData.weekday,
                scheduleData.time
            ]
        );
        return { id: result.rows[0].id, ...scheduleData };
    }

    // 删除课程
    async deleteSchedule(scheduleId, userId) {
        const result = await this.db.query(
            'DELETE FROM schedules WHERE id = ? AND user_id = ?',
            [scheduleId, userId]
        );
        return { changes: result.rowCount };
    }

    // 根据ID获取课程
    async getScheduleById(scheduleId, userId) {
        const result = await this.db.query(
            'SELECT * FROM schedules WHERE id = ? AND user_id = ?',
            [scheduleId, userId]
        );
        return result.rows[0] || null;
    }

    // 检查时间冲突
    async checkTimeConflict(weekday, time, excludeId = null, userId) {
        let query = 'SELECT * FROM schedules WHERE user_id = ? AND weekday = ? AND time = ?';
        const params = [userId, weekday, time];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await this.db.query(query, params);
        return result.rows.length > 0;
    }
}

module.exports = ScheduleDAO;
