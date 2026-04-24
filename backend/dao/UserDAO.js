class UserDAO {
    constructor(db) {
        this.db = db;
    }

    // 创建用户
    async createUser(username, password) {
        // 检查用户名是否已存在
        const existingUser = await this.db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('用户名已存在');
        }

        // 插入新用户
        const result = await this.db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, password]
        );

        return { id: result.rows[0].id, username };
    }

    // 验证用户登录
    async validateUser(username, password) {
        const result = await this.db.query(
            'SELECT id, username, password FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        
        // 简单的密码验证（实际项目中应该使用密码哈希）
        if (row.password === password) {
            return { id: row.id, username: row.username };
        } else {
            return null;
        }
    }
};

module.exports = UserDAO;