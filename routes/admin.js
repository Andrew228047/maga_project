const express = require('express');
const router = express.Router();
const pool = require('../db');
const { isAdmin, isAuthenticated } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Всі маршрути в цьому файлі захищені middleware isAdmin
router.use(isAdmin); 

// Масив днів. Індекс 0 = Нд, 1 = Пн, ..., 6 = Сб.
const DAY_NAMES = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// -----------------------------------------------------------------
// A. Головна Сторінка Адмін-Панелі
// -----------------------------------------------------------------

router.get('/dashboard', async (req, res) => {
    try {
        const [rooms] = await pool.query('SELECT id, name, capacity, description FROM rooms ORDER BY name');
        const [users] = await pool.query("SELECT id, username, role FROM users");
        
        const [scheduleItems] = await pool.query(`
            SELECT s.id, r.name AS room_name, s.room_id, s.day_of_week, s.lesson_number, s.subject 
            FROM schedule s JOIN rooms r ON s.room_id = r.id 
            ORDER BY s.day_of_week, s.lesson_number
        `);
        const [lessonTimes] = await pool.query('SELECT * FROM lesson_times ORDER BY lesson_number');

        res.render('admin/dashboard', { 
            rooms, 
            users, 
            scheduleItems,
            lessonTimes,
            dayNames: DAY_NAMES,
            success: req.query.success,
            user: req.session.user
        });
    } catch (error) {
        console.error('Помилка завантаження адмін-панелі:', error);
        res.status(500).send('Помилка завантаження адмін-панелі');
    }
});


// -----------------------------------------------------------------
// B. CRUD для Аудиторій (ROOMS)
// -----------------------------------------------------------------

// POST: Створення нової аудиторії
router.post('/rooms/add', async (req, res) => {
    const { name, capacity, description } = req.body;
    try {
        await pool.execute('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)',
            [name, parseInt(capacity), description]);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Аудиторія додана.'));
    } catch (error) {
        res.status(500).send('Помилка додавання аудиторії');
    }
});

// GET: Редагування аудиторії (показ форми)
router.get('/rooms/edit/:id', async (req, res) => {
    try {
        const [rooms] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        if (rooms.length === 0) return res.status(404).send('Аудиторія не знайдена');
        res.render('admin/edit_room', { 
            room: rooms[0],
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Помилка завантаження даних');
    }
});

// POST: Редагування аудиторії (обробка POST)
router.post('/rooms/edit/:id', async (req, res) => {
    const { name, capacity, description } = req.body;
    try {
        await pool.execute(
            'UPDATE rooms SET name = ?, capacity = ?, description = ? WHERE id = ?',
            [name, parseInt(capacity), description, req.params.id]
        );
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Аудиторія оновлена.'));
    } catch (error) {
        res.status(500).send('Помилка оновлення аудиторії');
    }
});

// POST: Видалення аудиторії
router.post('/rooms/delete/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Аудиторія та її розклад видалено.'));
    } catch (error) {
        res.status(500).send('Помилка видалення аудиторії');
    }
});


// -----------------------------------------------------------------
// C. CRUD для Розкладу (SCHEDULE)
// -----------------------------------------------------------------

// POST: Додати новий запис розкладу
router.post('/schedule/add', async (req, res) => {
    const { room_id, day_of_week, lesson_number, subject } = req.body;
    try {
        // day_of_week тут прийде як '1'...'6', що коректно для бази.
        await pool.execute(
            'INSERT INTO schedule (room_id, day_of_week, lesson_number, subject) VALUES (?, ?, ?, ?)',
            [room_id, day_of_week, lesson_number, subject]
        );
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Запис розкладу додано.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Помилка: Аудиторія вже зайнята у цей час.');
        }
        res.status(500).send('Помилка сервера при додаванні розкладу');
    }
});

// GET: Форма редагування розкладу
router.get('/schedule/edit/:id', async (req, res) => {
    try {
        const [item] = await pool.execute('SELECT * FROM schedule WHERE id = ?', [req.params.id]);
        const [rooms] = await pool.query('SELECT id, name FROM rooms');
        const [lessonTimes] = await pool.query('SELECT lesson_number, start_time, end_time FROM lesson_times');

        if (item.length === 0) return res.status(404).send('Запис не знайдено');

        res.render('admin/edit_schedule', { 
            item: item[0], 
            rooms: rooms,
            lessonTimes: lessonTimes,
            dayNames: DAY_NAMES, 
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Помилка завантаження даних');
    }
});

// POST: Оновити запис розкладу
router.post('/schedule/edit/:id', async (req, res) => {
    const { room_id, day_of_week, lesson_number, subject } = req.body;
    try {
        await pool.execute(
            'UPDATE schedule SET room_id = ?, day_of_week = ?, lesson_number = ?, subject = ? WHERE id = ?',
            [room_id, day_of_week, lesson_number, subject, req.params.id]
        );
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Розклад оновлено.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Помилка: Аудиторія вже зайнята у цей час.');
        }
        res.status(500).send('Помилка оновлення розкладу');
    }
});

// POST: Видалити запис розкладу
router.post('/schedule/delete/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM schedule WHERE id = ?', [req.params.id]);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Запис розкладу видалено.'));
    } catch (error) {
        res.status(500).send('Помилка видалення розкладу');
    }
});


// -----------------------------------------------------------------
// D. CRUD для Користувачів (USERS)
// -----------------------------------------------------------------

// POST: Створення нового користувача
router.post('/users/add', async (req, res) => {
    const { username, password, role } = req.body;
    if (password.length < 6) return res.status(400).send('Пароль має бути не менше 6 символів.');

    try {
        const password_hash = await bcrypt.hash(password, 10);
        await pool.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, password_hash, role]);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Користувач успішно доданий.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Помилка: Користувач з таким логіном вже існує.');
        }
        res.status(500).send('Помилка додавання користувача');
    }
});

// POST: Редагування користувача (роль/логін)
router.post('/users/edit/:id', async (req, res) => {
    const { username, role } = req.body;
    try {
        await pool.execute(
            'UPDATE users SET username = ?, role = ? WHERE id = ?',
            [username, role, req.params.id]
        );
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Користувач оновлений.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Помилка: Користувач з таким логіном вже існує.');
        }
        res.status(500).send('Помилка оновлення користувача');
    }
});

// POST: Зміна пароля користувача
router.post('/users/change-password/:id', async (req, res) => {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).send('Пароль має бути не менше 6 символів.');

    try {
        const password_hash = await bcrypt.hash(new_password, 10);
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash, req.params.id]
        );
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Пароль користувача оновлено.'));
    } catch (error) {
        res.status(500).send('Помилка зміни пароля');
    }
});

// POST: Видалення користувача
router.post('/users/delete/:id', async (req, res) => {
    if (req.session.user.id == req.params.id) {
        return res.status(400).send('Неможливо видалити власний обліковий запис.');
    }
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Користувача видалено.'));
    } catch (error) {
        res.status(500).send('Помилка видалення користувача');
    }
});


module.exports = router;
