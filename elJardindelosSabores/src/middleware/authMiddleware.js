const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        // Si no hay token, redirige al login
        return res.redirect('/login');
    }

    jwt.verify(token, 'secreto', (err, user) => {
        if (err) {
            return res.redirect('/login'); // Token inválido, redirige al login
        }
        req.user = user; // Guarda los datos del usuario en la petición
        next();
    });
};

// Middleware para verificar si el usuario es administrador
const verificarRolAdmin = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
};

module.exports = { verificarToken, verificarRolAdmin };
