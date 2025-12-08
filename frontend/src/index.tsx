import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4caf50",
    },
    secondary: {
      main: "#ff9800",
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Detect Ingress base path from meta tag (injected by backend)
const getBasename = () => {
  const baseMeta = document.querySelector("base");
  if (baseMeta) {
    const href = baseMeta.getAttribute("href");
    console.log(`🟢 [Frontend] Detected base path: ${href || '(none)'}`);
    return href ? href.replace(/\/$/, "") : "";
  }
  console.log(`🔵 [Frontend] No base tag found, using root path`);
  return "";
};

console.log(`🚀 [Frontend] GrowFlow starting...`);
console.log(`   URL: ${window.location.href}`);
console.log(`   Path: ${window.location.pathname}`);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={getBasename()}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
