import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import DatasetForm from './components/DatasetForm';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Upload from './pages/Upload';
import DatasetDetail from './pages/DatasetDetail';
import Map from './pages/Map';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const location = useLocation();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f9fc 0%, #f0f7fa 100%)'
    }}>
      <Navbar />
      <main
        key={location.pathname}
        style={{ 
          padding: '24px', 
          maxWidth: '1200px', 
          margin: '0 auto',
          width: '100%',
          flex: 1,
          paddingBottom: '40px', // Espace avant le footer
          minHeight: 'calc(100vh - 64px - 300px)', // Hauteur minimale pour pousser le footer
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/contribuer" element={<Upload />} />
          <Route path="/map" element={<Map />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dataset-form" element={<DatasetForm />} />
          <Route path="/dataset/:id" element={<DatasetDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
