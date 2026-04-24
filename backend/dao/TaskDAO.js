class TaskDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有任务
    async getAllTasks(userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // 创建新任务
    async createTask(taskData, userId = 1) {
        const result = await this.db.query(
            `INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
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
        let paramIndex = 1;

        // 动态构建更新字段
        if (taskData.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(taskData.name);
        }
        if (taskData.subject !== undefined) {
            fields.push(`subject = $${paramIndex++}`);
            values.push(taskData.subject);
        }
        if (taskData.duration !== undefined) {
            fields.push(`duration = $${paramIndex++}`);
            values.push(taskData.duration);
        }
        if (taskData.priority !== undefined) {
            fields.push(`priority = $${paramIndex++}`);
            values.push(taskData.priority);
        }
        if (taskData.deadline !== undefined) {
            fields.push(`deadline = $${paramIndex++}`);
            values.push(taskData.deadline);
        }
        if (taskData.is_completed !== undefined) {
            fields.push(`is_completed = $${paramIndex++}`);
            values.push(taskData.is_completed);
        }

        if (fields.length === 0) {
            return { changes: 0 };
        }

        values.push(taskId, userId);

        const result = await this.db.query(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
            values
        );

        return { changes: result.rowCount };
    }

    // 删除任务
    async deleteTask(taskId, userId = 1) {
        const result = await this.db.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );
        return { changes: result.rowCount };
    }

    // 根据ID获取任务
    async getTaskById(taskId, userId = 1) {
        const result = await this.db.query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );
        return result.rows[0] || null;
    }
}

module.exports = TaskDAO;