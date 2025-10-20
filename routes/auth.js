// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Сторінка входу (GET)
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Обробка входу (POST)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.render('login', { error: 'Невірний логін або пароль.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.render('login', { error: 'Невірний логін або пароль.' });
        }

        // Успішний вхід. Встановлюємо сесію.
        req.session.user = { id: user.id, username: user.username, role: user.role };
        
        // Визначаємо, куди перенаправити: спочатку на збережений URL, якщо його немає — за роллю.
        const redirectUrl = req.session.returnTo || (user.role === 'admin' ? '/admin/dashboard' : '/rooms');
        
        // Видаляємо збережений URL
        delete req.session.returnTo; 
        
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Помилка входу:', error);
        res.render('login', { error: 'Помилка сервера.' });
    }
});

// Вихід
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/login');
    });
});

module.exports = router;
