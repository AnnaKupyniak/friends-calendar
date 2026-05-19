import { createContext, useState, useEffect } from "react";
import { apiClient, setAuthContextRef } from "../api/axiosConfig";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function register(data) {
    try {
      await apiClient.post("/api/auth/register/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await getMe();
    } catch (err) {
      console.log("Помилка реєстрації:", err.response?.data || err.message);
      throw err;
    }
  }

  async function login(data) {
    try {
      setError(null);
      await apiClient.post("/api/auth/login", data);
      await getMe();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Помилка входу';
      setError(errorMsg);
      setUser(null);
      throw err;
    }
  }

  async function logout() {
    try {
      setError(null);
      await apiClient.post("/api/auth/logout", {});
      localStorage.removeItem("selectedEntity");
      setUser(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Помилка виходу';
      localStorage.removeItem("selectedEntity");
      setError(errorMsg);
      setUser(null);
    }
  }

  async function deleteUser() {
    try {
      setError(null);
      await apiClient.delete("/api/auth/delete");
      setUser(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Помилка видалення';
      setError(errorMsg);
    }
  }

  async function getMe() {
    try {
      const res = await apiClient.get("/api/auth/me");
      setUser(res.data.data);
    } catch (err) {
      setUser(null);
      // 401 is expected when not logged in — don't log as error
      if (err.response?.status !== 401) {
        console.log(err.response?.data || err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateDetails(data) {
    try {
      setError(null);
      const res = await apiClient.put("/api/auth/updatedetails", data);
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Помилка оновлення профілю';
      setError(errorMsg);
      throw err;
    }
  }

  async function updatePassword(data) {
    try {
      setError(null);
      await apiClient.put("/api/auth/updatepassword", data);
      await getMe();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Помилка оновлення пароля';
      setError(errorMsg);
      throw err;
    }
  }

  useEffect(() => {
    getMe();
    // Register this context with axios interceptor
    setAuthContextRef({ setUser, setError });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        setUser,
        register,
        login,
        logout,
        deleteUser,
        getMe,
        updateDetails,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
