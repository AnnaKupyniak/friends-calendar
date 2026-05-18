import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const EventsContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function EventsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/events`, { withCredentials: true });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("fetchEvents error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [user, fetchEvents]);

  const createEvent = async (eventData) => {
    try {
      const res = await axios.post(`${API_URL}/api/events`, eventData, {
        withCredentials: true,
      });
      setEvents((prev) => [...prev, res.data.event]);
      return res.data.event;
    } catch (err) {
      console.error("createEvent error:", err.response?.data || err.message);
      throw err;
    }
  };

  const updateEvent = async (id, eventData) => {
    try {
      const res = await axios.put(`${API_URL}/api/events/${id}`, eventData, {
        withCredentials: true,
      });
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? res.data.event : e))
      );
      return res.data.event;
    } catch (err) {
      console.error("updateEvent error:", err.response?.data || err.message);
      throw err;
    }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/events/${id}`, { withCredentials: true });
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("deleteEvent error:", err.response?.data || err.message);
      throw err;
    }
  };

  return (
    <EventsContext.Provider
      value={{ events, loading, fetchEvents, createEvent, updateEvent, deleteEvent }}
    >
      {children}
    </EventsContext.Provider>
  );
}
