const API_URL = '/api/auth';

export const authService = {
  // Registrar nuevo usuario
  register: async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      // MIGRACIÓN: Permitir recibir la cookie del servidor
      credentials: 'include' 
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    const data = await response.json();
    
    // MIGRACIÓN: Ya no guardamos el token. 
    // Solo guardamos datos públicos del usuario si es necesario para la UI.
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Iniciar sesión
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      // MIGRACIÓN: Importante para que el navegador acepte la cookie Set-Cookie
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    // MIGRACIÓN: El token ahora es gestionado automáticamente por el navegador vía Cookies.
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Cerrar sesión
  logout: async () => {
    // MIGRACIÓN: Llamamos al servidor para que limpie la cookie
    try {
      await fetch(`${API_URL}/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (err) {
      console.error("Error al cerrar sesión en servidor", err);
    }
    // Limpiamos datos locales
    localStorage.removeItem('user');
  },

  // Obtener usuario actual (datos locales persistidos)
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // MIGRACIÓN: getToken() ya no es posible/necesario desde JS si la cookie es HttpOnly
  getToken: () => {
    console.warn("El token está protegido en una cookie HttpOnly y no es accesible desde JS.");
    return null;
  },

  // Verificar si está autenticado
  // Ahora dependemos de si existe el objeto user o de una validación con el servidor
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },

  // Obtener perfil del servidor
  getProfile: async () => {
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      // MIGRACIÓN: No enviamos header Authorization, el navegador envía la cookie solo
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    return response.json();
  },

  // Hacer petición autenticada genérica
  fetchWithAuth: async (url, options = {}) => {
    const config = {
      ...options,
      // MIGRACIÓN: Incluir credenciales (cookies)
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
        // Ya no incluimos el Header Authorization manualmente
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expirado o inválido (la cookie ya no sirve)
      await authService.logout();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  }
};