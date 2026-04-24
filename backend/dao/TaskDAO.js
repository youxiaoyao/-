class TaskDAO {
    constructor(db) {
        this.db = db;
    }

    // 获取所有任务
    async getAllTasks(userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
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

    // 创建新任务
    async createTask(taskData, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO tasks (user_id, name, subject, duration, priority, deadline, is_completed)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    taskData.name,
                    taskData.subject,
                    taskData.duration,
                    taskData.priority,
                    taskData.deadline,
                    taskData.is_completed ? 1 : 0
                ],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ id: this.lastID, ...taskData });
                }
            );
        });
    }

    // 更新任务
    async updateTask(taskId, taskData, userId = 1) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            // 动态构建更新字段
            if (taskData.name !== undefined) {
                fields.push('name = ?');
                values.push(taskData.name);
            }
            if (taskData.subject !== undefined) {
                fields.push('subject = ?');
                values.push(taskData.subject);
            }
            if (taskData.duration !== undefined) {
                fields.push('duration = ?');
                values.push(taskData.duration);
            }
            if (taskData.priority !== undefined) {
                fields.push('priority = ?');
                values.push(taskData.priority);
            }
            if (taskData.deadline !== undefined) {
                fields.push('deadline = ?');
                values.push(taskData.deadline);
            }
            if (taskData.is_completed !== undefined) {
                fields.push('is_completed = ?');
                values.push(taskData.is_completed ? 1 : 0);
            }

            if (fields.length === 0) {
                resolve();
                return;
            }

            values.push(taskId, userId);

            this.db.run(
                `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
                values,
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

    // 删除任务
    async deleteTask(taskId, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM tasks WHERE id = ? AND user_id = ?',
                [taskId, userId],
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

    // 根据ID获取任务
    async getTaskById(taskId, userId = 1) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
                [taskId, userId],
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
}

module.exports = TaskDAO;