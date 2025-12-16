module.exports = {
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASS || 'pass',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '27017',
    DB_NAME: process.env.DB_NAME || 'myapp',
    SESSION_SECRET: process.env.SESSION_SECRET || 'test_secret',
    SALT_ROUND: 10
}