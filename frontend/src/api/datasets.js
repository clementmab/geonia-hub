import client from './client';

// ✅ Convertit un lien Google Drive de partage en lien de téléchargement direct
export function toDirectDownloadUrl(url) {
  if (!url) return url;

  // Format : https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Format : https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
  }

  // Lien déjà direct ou autre hébergeur → on laisse tel quel
  return url;
}




// ✅ getDatasets retourne l'OBJET complet { count, results, next, previous }
export const getDatasets = (params) =>
  client.get('/datasets/', { params }).then((r) => r.data);

export const getDataset = (id) =>
  client.get(`/datasets/${id}/`).then((r) => r.data);

// ✅ getCategories et getDepartments retournent un TABLEAU
export const getCategories = () =>
  client.get('/categories/').then((r) => r.data.results ?? r.data);

export const getDepartments = () =>
  client.get('/departments/').then((r) => r.data.results ?? r.data);

export const submitDataset = (data) =>
  client.post('/datasets/', data).then((r) => r.data);

export const downloadDataset = (id) =>
  client.post(`/datasets/${id}/download/`).then((r) => r.data);

export const login = (username, password) =>
  client.post('/auth/login/', { username, password }).then((r) => {
    localStorage.setItem('access_token', r.data.access);
    return r.data;
  });


