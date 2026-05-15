class TaskDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有任务
    async getAllTasks(userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // 创建新任务
    async createTask(taskData, userId = 1) {
        const result = await this.db.query(
            `INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed)
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                userId,
                taskData.name,
                taskData.subject,
                taskData.duration,
                taskData.priority,
                taskData.deadline,
                taskData.is_completed || false
            ]
        );
        return { id: result.rows[0].id, ...taskData };
    }

    // 更新任务
    async updateTask(taskId, taskData, userId = 1) {
        const fields = [];
        const values = [];

        if (taskData.name !== undefined) {
            fields.push(`name = ?`);
            values.push(taskData.name);
        }
        if (taskData.subject !== undefined) {
            fields.push(`subject = ?`);
            values.push(taskData.subject);
        }
        if (taskData.duration !== undefined) {
            fields.push(`duration = ?`);
            values.push(taskData.duration);
        }
        if (taskData.priority !== undefined) {
            fields.push(`priority = ?`);
            values.push(taskData.priority);
        }
        if (taskData.deadline !== undefined) {
            fields.push(`deadline = ?`);
            values.push(taskData.deadline);
        }
        if (taskData.is_completed !== undefined) {
            fields.push(`is_completed = ?`);
            values.push(taskData.is_completed);
        }

        if (fields.length === 0) {
            return { changes: 0 };
        }

        values.push(taskId, userId);

        const result = await this.db.query(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        return { changes: result.rowCount };
    }

    // 删除任务
    async deleteTask(taskId, userId = 1) {
        const result = await this.db.query(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        return { changes: result.rowCount };
    }

    // 根据ID获取任务
    async getTaskById(taskId, userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        return result.rows[0] || null;
    }
}

module.exports = TaskDAO;
