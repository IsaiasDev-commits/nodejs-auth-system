const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash'); // Para mensajes flash
require('dotenv').config(); // Cargar variables de entorno
require('./config/passport')(passport); // Importar configuración de Passport

const app = express();
const PORT = process.env.PORT || 3000;

// Verifica si las variables de entorno necesarias están definidas
if (!process.env.MONGO_URI || !process.env.SESSION_SECRET) {
  console.error('❌ Error: Faltan variables de entorno. Asegúrate de definir MONGO_URI y SESSION_SECRET en el archivo .env');
  process.exit(1); // Detiene la aplicación si faltan variables de entorno importantes
}

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Configuración de middleware
app.use(express.urlencoded({ extended: true })); // Analiza datos del formulario
app.use(express.static('public')); // Servir archivos estáticos desde 'public'
app.set('view engine', 'ejs'); // Usar EJS como motor de plantillas

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET, // Usar variable de entorno para el secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Asegúrate de usar esta URL
    collectionName: 'sessions' // Opcional, puedes especificar el nombre de la colección de sesiones
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // Sesión dura 1 día
    secure: process.env.NODE_ENV === 'production' // Solo en producción
  }
}));

// Inicializar Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configurar flash para mensajes
app.use(flash());

// Middleware global para hacer disponibles los mensajes flash en las vistas
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.usuario = req.user || null; // Hacer disponible el usuario autenticado
  next();
});

// Ruta de inicio (redirige a login si no está autenticado)
app.get('/', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.render('index'); // Renderiza la vista principal si el usuario está autenticado
});

// Rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('❌ Error en el servidor:', err);
  res.status(500).send('Algo salió mal en el servidor');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


