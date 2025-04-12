"use client"

import { BrowserRouter as Router } from "react-router-dom"
import { ThemeProvider } from "@mui/material/styles"
import theme from "./styles/theme"
import { AuthProvider } from "./contexts/AuthContext"
import { Header } from "./components/Shared/Layout"
import { Footer } from "./components/Shared/Layout"
import MobileNavigation from "./components/Shared/Layout/MobileNavigation"
import AppRoutes from "./routes/AppRoutes"
import { Box, Container } from "@mui/material"
import { useMobile } from "./hooks/use-mobile"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppContent() {
  const { isMobileOrTablet } = useMobile()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          pt: isMobileOrTablet ? 0 : 2,
          pb: isMobileOrTablet ? 8 : 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Container
          disableGutters
          sx={{
            width: "100%",
            flexGrow: 1,
            overflow: "auto",
            boxSizing: "border-box",
            px: 0,
          }}
        >
          <AppRoutes />
        </Container>
      </Box>
      {isMobileOrTablet ? <MobileNavigation /> : <Footer />}
    </Box>
  )
}

export default App
