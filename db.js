// db.js

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // <--- ЦЕЙ РЯДОК МАЄ БУТИ ДЛЯ ЧИТАННЯ .env

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    // Обов'язково використовуємо process.env, а не хардкодимо
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, // !!! КРИТИЧНО ВАЖЛИВО: ПОРТ AIVEN !!!
    
    ssl: {
        // Використовуємо абсолютний шлях до кореня проєкту 
        rejectUnauthorized: true
    },
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;