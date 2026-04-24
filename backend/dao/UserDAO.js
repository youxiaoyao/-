class UserDAO {
    constructor(db) {
        this.db = db;
    }

    // 创建用户
    async createUser(username, password) {
        return new Promise((resolve, reject) => {
            // 检查用户名是否已存在
            this.db.get(
                'SELECT id FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        reject(new Error('用户名已存在'));
                        return;
                    }

                    // 插入新用户
                    this.db.run(
                        'INSERT INTO users (username, password) VALUES (?, ?)',
                        [username, password],
                        function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({ id: this.lastID, username });
                        }
                    );
                }
            );
        });
    }

    // 验证用户登录
    async validateUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, username, password FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(null);
                        return;
                    }

                    // 简单的密码验证（实际项目中应该使用密码哈希）
                    if (row.password === password) {
                        resolve({ id: row.id, username: row.username });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }
};

module.exports = UserDAO;
