const mysql = require('mysql2/promise');

// Функція для отримання значень з env, пріоритет: Railway (MYSQL_) > Local (DB_)
const getEnv = (key) => {
    // 1. Спроба отримати стандартну змінну Railway (MYSQL_HOST, MYSQL_USER)
    let value = process.env[key];

    if (value) {
        console.log(`[DB CONFIG]: Using Railway environment variable: ${key}`);
        return value;
    }

    // 2. Спроба отримати локальну змінну (DB_HOST, DB_USER)
    const localKey = key.replace('MYSQL_', 'DB_');
    value = process.env[localKey];
    
    if (value) {
        console.log(`[DB CONFIG]: Using local environment variable: ${localKey}`);
        return value;
    }

    // 3. Спеціальна обробка для імені бази даних, яке може бути відсутнє, але часто є 'railway'
    if (key === 'MYSQL_DATABASE') {
        // Це те, чого не вистачало. Якщо назва БД відсутня в ENV, використовуємо 'railway' за замовчуванням.
        console.warn(`[DB CONFIG WARNING]: Environment variable ${key} or DB_NAME is missing. Using default 'railway'.`);
        return 'railway'; 
    }
    
    // 4. Повернення undefined для обов'язкових полів (HOST, USER, PASSWORD), 
    // що призведе до помилки, якщо вони відсутні.
    return undefined;
};

// Змінні, необхідні для підключення
const dbConfig = {
    host: getEnv('MYSQL_HOST'),
    user: getEnv('MYSQL_USER') || 'root', // Зазвичай на Railway root
    password: getEnv('MYSQL_PASSWORD') || getEnv('MYSQL_ROOT_PASSWORD'),
    database: getEnv('MYSQL_DATABASE'), // Тепер шукає MYSQL_DATABASE і повертає 'railway' за замовчуванням
    port: getEnv('MYSQL_PORT') || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Перевірка наявності критичних змінних
if (!dbConfig.host || !dbConfig.password) {
    console.error("FATAL ERROR: MySQL connection configuration is incomplete. Check MYSQL_HOST and MYSQL_PASSWORD.");
    // У production цей код може викликати виняток, щоб запобігти запуску.
}

// Створення пулу підключень
const pool = mysql.createPool(dbConfig);

console.log('MySQL Pool created successfully.');

module.exports = pool;