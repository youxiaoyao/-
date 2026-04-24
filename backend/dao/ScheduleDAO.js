class ScheduleDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有课程
    async getAllSchedules(userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM schedules WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // 创建新课程
    async createSchedule(scheduleData, userId = 1) {
        const result = await this.db.query(
            `INSERT INTO schedules (user_id, name, teacher, location, week, weekday, time)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
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
    async deleteSchedule(scheduleId, userId = 1) {
        const result = await this.db.query(
            'DELETE FROM schedules WHERE id = $1 AND user_id = $2',
            [scheduleId, userId]
        );
        return { changes: result.rowCount };
    }

    // 根据ID获取课程
    async getScheduleById(scheduleId, userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
            [scheduleId, userId]
        );
        return result.rows[0] || null;
    }

    // 检查时间冲突
    async checkTimeConflict(weekday, time, excludeId = null, userId = 1) {
        let query = 'SELECT * FROM schedules WHERE user_id = $1 AND weekday = $2 AND time = $3';
        const params = [userId, weekday, time];

        if (excludeId) {
            query += ' AND id != $4';
            params.push(excludeId);
        }

        const result = await this.db.query(query, params);
        return result.rows.length > 0;
    }
}

module.exports = ScheduleDAO;