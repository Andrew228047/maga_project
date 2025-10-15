// routes/rooms.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getCurrentLessonNumber } = require('../helpers/schedule');
const { isAuthenticated } = require('../middleware/auth'); // <-- ІМПОРТ MIDDLEWARE

// Список усіх аудиторій (Захищений маршрут)
// Використовуємо '/' для того, щоб він відповідав '/rooms' завдяки app.use('/rooms', ...) 
// Якщо app.use('/', roomsRoutes), то це відповідає '/rooms' завдяки app.get('/', ...) в app.js
router.get('/rooms', isAuthenticated, async (req, res) => {
    try {
        const [rooms] = await pool.query('SELECT * FROM rooms ORDER BY name');
        res.render('index', { 
            rooms: rooms, 
            user: req.session.user // Передача даних користувача
        });
    } catch (error) {
        console.error('Помилка завантаження списку аудиторій:', error);
        res.status(500).send('Помилка сервера');
    }
});

// Деталі аудиторії (Захищений маршрут)
router.get('/room/:id', isAuthenticated, async (req, res) => {
    const roomId = req.params.id;
    
    try {
        // 1. Інформація про аудиторію
        const [roomResult] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (roomResult.length === 0) return res.status(404).send('Аудиторія не знайдена');
        const room = roomResult[0];

        // 2. Повний розклад
        const [scheduleResult] = await pool.execute(
            `SELECT s.*, lt.start_time, lt.end_time 
             FROM schedule s
             JOIN lesson_times lt ON s.lesson_number = lt.lesson_number
             WHERE s.room_id = ? 
             ORDER BY s.day_of_week, s.lesson_number`,
            [roomId]
        );
        const [lessonTimesQuery] = await pool.query('SELECT * FROM lesson_times ORDER BY lesson_number');

        // 3. Визначення поточного статусу
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); 
        const currentTime = today.toTimeString().split(' ')[0];
        const currentLessonNumber = getCurrentLessonNumber(currentTime);

        let status = { occupied: false, details: null, time: null };

        if (currentLessonNumber !== 0) {
            const [currentLesson] = await pool.execute(
                `SELECT s.subject, lt.start_time, lt.end_time
                 FROM schedule s
                 JOIN lesson_times lt ON s.lesson_number = lt.lesson_number
                 WHERE s.room_id = ? AND s.day_of_week = ? AND s.lesson_number = ?`,
                [roomId, dayOfWeek, currentLessonNumber]
            );

            if (currentLesson.length > 0) {
                status.occupied = true;
                status.details = currentLesson[0].subject;
                status.time = `${currentLesson[0].start_time.substring(0, 5)} - ${currentLesson[0].end_time.substring(0, 5)}`;
            } else {
                // Вільна під час поточної пари
                const lt = lessonTimesQuery.find(t => t.lesson_number === currentLessonNumber);
                if (lt) {
                   status.time = `${lt.start_time.substring(0, 5)} - ${lt.end_time.substring(0, 5)}`;
                }
            }
        }
        
        // Перетворення розкладу для таблиці
        const organizedSchedule = Array(5).fill(null).map(() => Array(4).fill('ВІЛЬНА')); 
        
        scheduleResult.forEach(item => {
            if (item.day_of_week >= 1 && item.day_of_week <= 5) {
                 organizedSchedule[item.day_of_week - 1][item.lesson_number - 1] = item.subject;
            }
        });
        
        res.render('room_detail', { 
            room: room, 
            status: status, 
            schedule: organizedSchedule, 
            dayNames: ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця'],
            lessonTimes: lessonTimesQuery,
            user: req.session.user // <-- Передача даних користувача
        });

    } catch (error) {
        console.error('Помилка сервера при завантаженні аудиторії:', error);
        res.status(500).send('Помилка сервера при завантаженні аудиторії');
    }
});

module.exports = router;
