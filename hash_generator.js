// hash_generator.js
const bcrypt = require('bcryptjs');

const password = 'admin';
const saltRounds = 10; // Це наш cost factor $10

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Пароль: ${password}`);
        console.log(`Хеш: ${hash}`);
    }
});