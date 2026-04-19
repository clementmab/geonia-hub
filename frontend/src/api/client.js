import axios from 'axios';

const apiBaseUrl = (
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '');

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 secondes de timeout
});

// Ajoute automatiquement le token JWT si l'utilisateur est connecté
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les timeouts et erreurs réseau
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si c'est un timeout ou une erreur réseau
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('Timeout détecté, nouvel essai...');
      // Attendre 2 secondes avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 2000));
      return client(originalRequest);
    }

    // Si le serveur ne répond pas (backend endormi)
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.log('Serveur indisponible, tentative de réveil...');
      // Attendre 3 secondes et réessayer une fois
      await new Promise(resolve => setTimeout(resolve, 3000));
      return client(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default client;
