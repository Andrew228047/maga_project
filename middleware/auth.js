// middleware/auth.js

// Перевіряє, чи користувач автентифікований
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        // Зберігаємо початковий URL, куди користувач хотів потрапити
        req.session.returnTo = req.originalUrl; 
        res.redirect('/login');
    }
}

// Перевіряє, чи користувач має роль адміністратора
function isAdmin(req, res, next) {
    // Спочатку перевіряємо, чи користувач взагалі автентифікований
    if (!req.session.user) {
        req.session.returnTo = req.originalUrl; 
        return res.redirect('/login');
    }
    
    // Потім перевіряємо роль
    if (req.session.user.role === 'admin') {
        next();
    } else {
        // Якщо не адмін, забороняє доступ
        res.status(403).send('Доступ заборонено. Потрібні права адміністратора.');
    }
}

module.exports = { isAuthenticated, isAdmin };