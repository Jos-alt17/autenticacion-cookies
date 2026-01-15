const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simulación de base de datos en memoria
let users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: '$2a$10$YourHashedPasswordHere', 
    name: 'Administrador',
    role: 'admin',
    createdAt: new Date('2024-01-01')
  }
];
let nextId = 2;

// --- CONFIGURACIÓN DE COOKIE ---
const cookieOptions = {
  httpOnly: true, // Evita acceso desde JavaScript (Protección XSS)
  secure: process.env.NODE_ENV === 'production', // Solo true en producción (HTTPS)
  sameSite: 'lax', // Protección básica contra CSRF
  maxAge: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
};

// POST /api/auth/register - Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: nextId++,
      email,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: new Date()
    };

    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // MIGRACIÓN: Enviar token vía Cookie
    res.cookie('token', token, cookieOptions);

    const { password: _, ...userWithoutPassword } = newUser;
    console.log(`✅ Usuario registrado: ${email}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // MIGRACIÓN: Enviar token vía Cookie
    res.cookie('token', token, cookieOptions);

    const { password: _, ...userWithoutPassword } = user;
    console.log(`✅ Login exitoso: ${email}`);

    res.json({
      message: 'Login exitoso',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada correctamente' });
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }