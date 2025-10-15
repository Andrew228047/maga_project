// db.js
// Цей код адаптується для роботи ЛОКАЛЬНО (через .env) і на RAILWAY (через вбудовані змінні)
const mysql = require('mysql2/promise');
// УВАГА: require('dotenv').config() має бути викликаний у головному app.js 
// або іншому стартовому файлі, щоб цей файл бачив змінні.

// Функція для отримання змінних середовища: спочатку шукає DB_..., потім MYSQL_...
const getEnv = (key) => {
    // 1. Спробуйте знайти загальне ім'я (наприклад, DB_HOST)
    let value = process.env[key];
    
    // 2. Якщо не знайдено, спробуйте знайти ім'я, яке надає Railway (наприклад, MYSQL_HOST)
    if (!value) {
        // Замінюємо 'DB_' на 'MYSQL_'
        const railwayKey = key.replace('DB_', 'MYSQL_'); 
        value = process.env[railwayKey];
    }
    
    if (!value) {
        console.warn(`[DB CONFIG WARNING]: Environment variable ${key} or ${key.replace('DB_', 'MYSQL_')} is missing.`);
    }

    return value;
};


const poolConfig = {
    // Використовуємо функцію getEnv, щоб підтримувати DB_ (локально) та MYSQL_ (на Railway)
    host: getEnv('DB_HOST'),
    user: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
    database: getEnv('DB_NAME'),
    port: getEnv('DB_PORT'), 
    
    // *** КОНФІГУРАЦІЯ SSL ВИДАЛЕНА ***
    // Це правильно для внутрішнього підключення на Railway.
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(poolConfig);
    console.log("MySQL Pool created successfully.");
} catch (error) {
    console.error("Failed to create MySQL pool. Check your credentials:", error);
}

module.exports = pool;
