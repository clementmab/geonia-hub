import axios from 'axios';

const apiBaseUrl = (
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '');

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Ajoute automatiquement le token JWT si l'utilisateur est connecté
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
