import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(data) {
  try {
    await axios.post(`${API_URL}/auth/register`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true 
    });
    
    await getMe();
  } catch (err) {
    console.log("Помилка реєстрації:", err.response?.data || err.message);
    throw err;
  }
}

  async function login(data) {
    try {
      await axios.post(`${API_URL}/auth/login`, data, { withCredentials: true });
      await getMe();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function deleteUser() {
    try {
      await axios.delete(`${API_URL}/auth/delete`, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function getMe() {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
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
      await axios.post(`${API_URL}/auth/updatedetails`, data, { withCredentials: true });
      await getMe();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function updatePassword(data) {
    try {
      await axios.post(`${API_URL}/auth/updatepassword`, data, { withCredentials: true });
      await getMe();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  useEffect(() => {
    getMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
