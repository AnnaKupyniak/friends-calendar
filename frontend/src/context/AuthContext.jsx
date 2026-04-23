import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { setAuthContextRef } from "../api/axiosConfig";

export const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function register(data) {
    try {
      await axios.post(`${API_URL}/api/auth/register/`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
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
      await axios.post(`${API_URL}/api/auth/login`, data, {
        withCredentials: true,
      });
      await getMe();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      setUser(null);
      throw err;
    }
  }

  async function logout() {
    try {
      setError(null);
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
      setUser(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Logout failed';
      setError(errorMsg);
      setUser(null);
    }
  }

  async function deleteUser() {
    try {
      setError(null);
      await axios.delete(`${API_URL}/api/auth/delete`, {
        withCredentials: true,
      });
      setUser(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Delete failed';
      setError(errorMsg);
    }
  }

  async function getMe() {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(res.data.data);
    } catch (err) {
      setUser(null);
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateDetails(data) {
    try {
      setError(null);
      const res = await axios.put(`${API_URL}/api/auth/updatedetails`, data, {
        withCredentials: true,
      });
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Update failed';
      setError(errorMsg);
      throw err;
    }
  }

  async function updatePassword(data) {
    try {
      setError(null);
      await axios.put(`${API_URL}/api/auth/updatepassword`, data, {
        withCredentials: true,
      });
      await getMe();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Password update failed';
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
