// helpers/schedule.js
function getCurrentLessonNumber(currentTime) {
    const times = [
        { num: 1, start: '08:30:00', end: '10:05:00' },
        { num: 2, start: '10:20:00', end: '11:55:00' },
        { num: 3, start: '12:10:00', end: '13:45:00' },
        { num: 4, start: '15:15:00', end: '16:50:00' }
    ];

    for (const lesson of times) {
        if (currentTime >= lesson.start && currentTime <= lesson.end) {
            return lesson.num;
        }
    }
    return 0; // Перерва або поза розкладом
}

module.exports = { getCurrentLessonNumber };