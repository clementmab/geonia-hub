import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Upload from './pages/Upload';
import DatasetDetail from './pages/DatasetDetail';   // ← ajouter

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/catalogue"  element={<Catalogue />} />
            <Route path="/contribuer" element={<Upload />} />
            <Route path="/dataset/:id"     element={<DatasetDetail />} />  {/* ← ajouter */}
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;