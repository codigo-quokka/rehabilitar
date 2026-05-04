import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { routes } from "./routes";

function AppRoutes() {
  return useRoutes(routes);
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
