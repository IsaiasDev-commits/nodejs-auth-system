const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Modelo de Usuario
const bcrypt = require('bcryptjs'); // Para cifrar las contraseñas
const passport = require('passport');

// Ruta para mostrar el formulario de login
router.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error') }); // Flash para errores
});

// Ruta para mostrar el formulario de registro
router.get('/register', (req, res) => {
  res.render('register', { error: null }); // No hay error por defecto
});

// Ruta para manejar el registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validación básica
  if (!username || !password) {
    req.flash('error', 'Todos los campos son requeridos');
    return res.redirect('/register');
  }

  if (password.length < 8) {
    req.flash('error', 'La contraseña debe tener al menos 8 caracteres');
    return res.redirect('/register');
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash('error', 'El usuario ya existe');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();
    req.flash('success_msg', 'Registro exitoso, ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    console.error('❌ Error al registrar el usuario:', error);
    req.flash('error', 'Error al registrar el usuario');
    res.redirect('/register');
  }
});

// Ruta para manejar el login con Passport
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/', // Redirigir a la página principal si el login es exitoso
    failureRedirect: '/login', // Redirigir a login si el login falla
    failureFlash: true // Mostrar mensaje de error usando flash
  })(req, res, next);
});

// Ruta de logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('❌ Error en el logout:', err);
      return next(err);
    }
    req.flash('success_msg', 'Sesión cerrada correctamente');
    res.redirect('/login');
  });
});

module.exports = router;








