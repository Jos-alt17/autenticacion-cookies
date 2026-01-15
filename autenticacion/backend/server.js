const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 1. Importamos cookie-parser
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Middlewares
// Nota: Si tu frontend está en otro puerto (ej. Live Server), 
// cors necesita 'credentials: true' para permitir cookies.
app.use(cors({
  origin: true, // O especifica tu url de frontend
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser()); // 2. Usamos el middleware para leer cookies

// Rutas
app.use('/api/auth', authRoutes);

// Ruta protegida de ejemplo
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Acceso concedido a contenido protegido',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Middleware de autenticación ACTUALIZADO
function authenticateToken(req, res, next) {
  // 3. Ahora extraemos el token de las cookies en lugar del header Authorization
  const token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado (Cookie no encontrada)' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: '🔐 API de Autenticación (Migrada a Cookies)',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login (Establece cookie)',
      profile: 'GET /api/auth/me (Lee de cookie)',
      protected: 'GET /api/protected (Lee de cookie)'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Documentación: http://localhost:${PORT}`);
});