// app.js
require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
// Імпортуємо MySQLStore
const MySQLStore = require('express-mysql-session')(session); 
const db = require('./config/db'); // Ваш пул підключень

const app = express();

// Налаштування MySQL Session Store:
// Використовуємо пул підключень, який ми створили в db.js
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 хвилин
    expiration: 86400000, // 24 години
    createTableIfMissing: true, // Це створить необхідну таблицю 'sessions' у вашій БД
    endConnectionOnClose: true
}, db); 

// Налаштування Express Session
app.use(session({
    secret: process.env.SESSION_SECRET, 
    store: sessionStore, // ВИКОРИСТОВУЄМО MySQL Store
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: 'auto', // Railway використовує HTTPS, 'auto' обробляє це
        maxAge: 86400000 
    }
}));

// Глобальна змінна для доступу до даних користувача у всіх шаблонах
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// 4. Маршрути
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/', roomsRoutes);
app.use('/admin', adminRoutes);

// Головна сторінка
app.get('/', (req, res) => {
    res.redirect('/rooms');
});

// 5. Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});