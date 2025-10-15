// app.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

// 1. Ініціалізація та конфігурація
const app = express();
const PORT = process.env.PORT || 3000; // Використовуйте порт, наданий Render, або 3000 локально


// 2. Налаштування шаблонізатора EJS
app.set('view engine', 'ejs');
app.set('views', 'views');

// 3. Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Для статичних файлів (CSS/JS)

// Налаштування сесій
app.use(session({
    secret: 'SUPER_SECRET_KEY', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 години
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