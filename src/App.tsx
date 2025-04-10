'use client';

import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Shared/Layout';
import { Footer } from './components/Shared/Layout';
import MobileNavigation from './components/Shared/Layout/MobileNavigation';
import AppRoutes from './routes/AppRoutes';
import { Box } from '@mui/material';
import { useMobile } from './hooks/use-mobile';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isMobileOrTablet } = useMobile();

  return (
    <>
      <Header />
      <Box
        sx={{
          minHeight: isMobileOrTablet
            ? 'calc(100vh - 112px)'
            : 'calc(100vh - 128px)',
          pt: isMobileOrTablet ? 0 : 2,
          pb: isMobileOrTablet ? 8 : 2,
        }}
      >
        <AppRoutes />
      </Box>
      {isMobileOrTablet ? <MobileNavigation /> : <Footer />}
    </>
  );
}

export default App;
