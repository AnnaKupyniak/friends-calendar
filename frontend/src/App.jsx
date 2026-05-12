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
import Comments from "./pages/Comments/Comments.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import MyCalendar from "./pages/MyCalendar/MyCalendar.jsx";

function App() {
  return (
    <AuthProvider>
      <FriendsProvider>
        <MemoriesProvider>
          <Header />
          <div className="app-body">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
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

            <Route
              path="/comments/:id"
              element={
                <ProtectedRoute>
                  <Comments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />

            <Route
              path="/myCalendar"
              element={
                <ProtectedRoute>
                  <MyCalendar />
                </ProtectedRoute>
              }
            />
          </Routes>
          </div>
        </MemoriesProvider>
      </FriendsProvider>
    </AuthProvider>
  );
}

export default App;
