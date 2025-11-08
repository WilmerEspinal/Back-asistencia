const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

// Middleware para verificar roles específicos
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const userRole = req.user.rol_id;
    
    // Si no se especifica rol o el rol no está en los permitidos
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. Rol insuficiente.',
        required: allowedRoles,
        current: userRole
      });
    }
    
    next();
  };
}

// Middleware para verificar si es administrador (rol 1) o supervisor (rol 2)
function requireAdminOrSupervisor(req, res, next) {
  return requireRole([1, 2])(req, res, next);
}

// Middleware para verificar si es administrador (rol 1)
function requireAdmin(req, res, next) {
  return requireRole([1])(req, res, next);
}

// Middleware para verificar si es supervisor (rol 2) ÚNICAMENTE
function requireSupervisor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  const userRole = req.user.rol_id;
  
  // Solo permitir rol_id = 2 (Supervisor)
  if (userRole !== 2) {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo supervisores pueden acceder a este recurso.',
      required: 'Supervisor (rol_id: 2)',
      current: `rol_id: ${userRole}`
    });
  }
  
  next();
}

module.exports = { 
  signToken, 
  authRequired, 
  requireRole, 
  requireAdminOrSupervisor, 
  requireAdmin,
  requireSupervisor
};


