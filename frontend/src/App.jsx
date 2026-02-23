import { Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header.jsx";
import Home from "./pages/Home/Home.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import { FriendsProvider } from "./context/FriendsContext.jsx";
import { MemoriesProvider } from "./context/MemoriesContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <FriendsProvider>
                <MemoriesProvider>
                  <Home />
                </MemoriesProvider>
              </FriendsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
