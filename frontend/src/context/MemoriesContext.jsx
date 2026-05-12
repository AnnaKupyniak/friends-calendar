import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  const fetchMemories = useCallback(async (pageNum = 1) => {
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
  }, [loading]);

  useEffect(() => {
    if (user) {
      setPage(1);
      fetchMemories(1);
    }
  }, [user, fetchMemories]);

  const createMemory = useCallback(async (formData) => {
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
  }, []);

  const createComment = useCallback(async (memoryId, fieldData) => {
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
  }, []);

  const getComments = useCallback(async (memoryId) => {
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
  }, []);

  const updateMemory = useCallback(async (memoryId, updatedData, selectedFiles = []) => {
    try {
      const formData = new FormData();
      Object.keys(updatedData).forEach((key) => {
        if (Array.isArray(updatedData[key])) {
          updatedData[key].forEach((val) => formData.append(key, val));
        } else {
          formData.append(key, updatedData[key]);
        }
      });

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("photos", file);
        });
      }

      const res = await axios.put(
        `${API_URL}/api/memories/${memoryId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
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
  }, []);

  const deleteMemory = useCallback(async (memoryId) => {
    try {
      await axios.delete(`${API_URL}/api/memories/${memoryId}`, {
        withCredentials: true,
      });

      setMemories((prev) => prev.filter((m) => m._id !== memoryId));
    } catch (err) {
      console.log(err.response?.data || err.message);
      throw err;
    }
  }, []);

  const searchMemories = useCallback(async (params) => {
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
  }, []);

  const getAllTags = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/memories/tags`, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      console.error("Error fetching tags:", err);
      throw err;
    }
  }, []);
  const getMemoryById = useCallback((memoryId) => {
    return memories.find((m) => m._id === memoryId);
  }, [memories]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

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
