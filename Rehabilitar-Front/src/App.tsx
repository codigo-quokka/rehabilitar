import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { routes } from "./routes";

function AppRoutes() {
  return useRoutes(routes);
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
