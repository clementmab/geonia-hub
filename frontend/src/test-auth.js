// Test script pour vérifier la navigation après authentification
// Exécuter dans la console du navigateur après connexion/inscription

console.log('=== Test Navigation Auth ===');

// 1. Vérifier le token
const token = localStorage.getItem('access_token');
console.log('Token présent:', !!token);

// 2. Vérifier les données utilisateur
const userData = localStorage.getItem('user');
console.log('Données utilisateur brutes:', userData);

try {
  const parsedUser = JSON.parse(userData);
  console.log('Utilisateur parsé:', parsedUser);
  console.log('Nom d\'utilisateur:', parsedUser.username);
  console.log('Prénom:', parsedUser.first_name);
} catch (e) {
  console.error('Erreur parsing user:', e);
}

// 3. Vérifier les événements
console.log('Test événement authChange...');
window.addEventListener('authChange', () => {
  console.log('Événement authChange reçu');
});

// 4. Simuler un clic de navigation
setTimeout(() => {
  console.log('Simulation navigation vers /catalogue...');
  window.location.href = '/catalogue';
}, 2000);
