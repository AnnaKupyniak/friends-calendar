import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const MemoriesContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function MemoriesProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [memories, setMemories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const getToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  };

  useEffect(() => {
    if (user) fetchMemories();
  }, [user]);

  async function fetchMemories() {
    try {
      const res = await axios.get(`${API_URL}/memories`, { 
        withCredentials: true 
      });
      setMemories(res.data.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  const createMemory = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/memories`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });

      setMemories(prev => [response.data.data, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Error in createMemory:', error.response?.data || error.message);
      throw error;
    }
  };

  async function updateMemory(memoryId, updatedData) {
    try {
      const res = await axios.put(`${API_URL}/memories/${memoryId}`, updatedData, {
        withCredentials: true,
      });

      setMemories((prev) =>
        prev.map((m) => (m._id === memoryId ? res.data.data : m)),
      );
      
      return res.data;
    } catch (err) {
      console.log(err.response?.data || err.message);
      throw err;
    }
  }

  async function deleteMemory(memoryId) {
    try {
      await axios.delete(`${API_URL}/memories/${memoryId}`, {
        withCredentials: true,
      });

      setMemories((prev) => prev.filter((m) => m._id !== memoryId));
    } catch (err) {
      console.log(err.response?.data || err.message);
      throw err;
    }
  }

  return (
    <MemoriesContext.Provider
      value={{
        memories,
        fetchMemories,
        createMemory,
        updateMemory,
        deleteMemory,
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </MemoriesContext.Provider>
  );
}