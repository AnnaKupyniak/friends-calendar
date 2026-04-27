import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const MemoriesContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function MemoriesProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [memories, setMemories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (user) {
      setPage(1);
      fetchMemories(1);
    }
  }, [user]);

  async function fetchMemories(pageNum = 1) {
    if (loading && pageNum !== 1) return;
    
    try {
      setLoading(true);
      const skip = (pageNum - 1) * ITEMS_PER_PAGE;
      const res = await axios.get(
        `${API_URL}/api/memories?skip=${skip}&limit=${ITEMS_PER_PAGE}`,
        { withCredentials: true }
      );
      
      if (pageNum === 1) {
        setMemories(res.data.data || []);
      } else {
        setMemories((prev) => [...prev, ...(res.data.data || [])]);
      }
      
      setHasMore((res.data.data || []).length === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }

  const createMemory = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/api/memories`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMemories((prev) => [response.data.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error(
        "Error in createMemory:",
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  const createComment = async (memoryId, fieldData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/memories/${memoryId}/comments`,
        fieldData,
        { withCredentials: true },
      );

      return response.data.data;
    } catch (error) {
      console.error(
        "Error in comments:",
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  const getComments = async (memoryId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/memories/${memoryId}/comments`,
        { withCredentials: true },
      );

      return response.data.data || [];
    } catch (error) {
      console.error(
        "Error in comments:",
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  async function updateMemory(memoryId, updatedData, selectedFiles = []) {
    try {
      // 1. Створюємо об'єкт FormData замість звичайного об'єкта
      const formData = new FormData();

      // 2. Додаємо текстові поля (title, description тощо)
      Object.keys(updatedData).forEach((key) => {
        // Якщо це масив (наприклад, старі imageUrls), додаємо кожен елемент окремо
        if (Array.isArray(updatedData[key])) {
          updatedData[key].forEach((val) => formData.append(key, val));
        } else {
          formData.append(key, updatedData[key]);
        }
      });

      // 3. Додаємо нові файли зображень
      // Важливо: назва 'photos' має збігатися з тим, що вказано в роуті на бекенді
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("photos", file);
        });
      }

      // 4. Відправляємо запит
      const res = await axios.put(
        `${API_URL}/api/memories/${memoryId}`,
        formData, // Передаємо formData
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data", // Axios зазвичай ставить це автоматично для FormData
          },
        },
      );

      setMemories((prev) =>
        prev.map((m) => (m._id === memoryId ? res.data.data : m)),
      );

      return res.data;
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      throw err;
    }
  }

  async function deleteMemory(memoryId) {
    try {
      await axios.delete(`${API_URL}/api/memories/${memoryId}`, {
        withCredentials: true,
      });

      setMemories((prev) => prev.filter((m) => m._id !== memoryId));
    } catch (err) {
      console.log(err.response?.data || err.message);
      throw err;
    }
  }
  const getMemoryById = (memoryId) => {
    return memories.find((m) => m._id === memoryId);
  };
  const searchMemories = async (params) => {
  try {
    setSearchLoading(true);
    setIsSearching(true);

    const queryString = new URLSearchParams(params).toString();

    const res = await axios.get(
      `${API_URL}/api/memories/search?${queryString}`,
      { withCredentials: true }
    );

    setSearchResults(res.data.data || []);
    return res.data.data;

  } catch (err) {
    console.error("Search error:", err.response?.data || err.message);
    throw err;
  } finally {
    setSearchLoading(false);
  }
};
const clearSearch = () => {
  setSearchResults([]);
  setIsSearching(false);
};

const getAllTags = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/memories/tags`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching tags:", err);
    throw err;
  }
};

  return (
    <MemoriesContext.Provider
      value={{
  memories,
  searchResults,
  searchMemories,
  clearSearch,
  getAllTags,
  isSearching,
  searchLoading,

  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  selectedDate,
  setSelectedDate,
  createComment,
  getComments,
  getMemoryById,
  page,
  hasMore,
  loading,
  loadMore: () => fetchMemories(page + 1),
}}
    >
      {children}
    </MemoriesContext.Provider>
  );
}
