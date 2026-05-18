import { useContext, useMemo, useState } from "react";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/uk";
import isBetween from "dayjs/plugin/isBetween";
import {
  Camera,
  CalendarDays,
  Flame,
  Inbox,
  CalendarPlus,
  BookOpen,
  ListChecks,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import { MemoriesContext } from "../../context/MemoriesContext";
import { EventsContext } from "../../context/EventsContext";
import MemoryCard from "../../features/memories/MemoryCard";
import EventCard from "../../features/events/EventCard";
import CreateEventModal from "../../features/events/CreateEventModal";
import "./MyCalendar.css";

dayjs.extend(isBetween);
dayjs.locale("uk");

const API_URL = import.meta.env.VITE_API_URL;
const TODAY = dayjs().startOf("day");

export default function MyCalendar() {
  const { user } = useContext(AuthContext);
  const { friendships = [], groups = [] } = useContext(FriendsContext);
  const { memories = [] } = useContext(MemoriesContext);
  const { events = [], createEvent, updateEvent, deleteEvent } = useContext(EventsContext);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [activeTab, setActiveTab] = useState("memories"); // "memories" | "events"
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  // ── Memories ──
  const myMemories = useMemo(() => {
    if (!user) return [];
    return memories.filter((m) => {
      return (
        String(m.createdBy) === String(user._id) ||
        String(m.entity) === String(user._id) ||
        friendships.some((f) => String(f._id) === String(m.entity)) ||
        groups.some((g) => String(g._id) === String(m.entity))
      );
    });
  }, [memories, user, friendships, groups]);

  const memoryDates = useMemo(() => {
    const set = new Set();
    myMemories.forEach((m) => set.add(dayjs(m.date).format("YYYY-MM-DD")));
    return set;
  }, [myMemories]);

  const memoriesForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return myMemories.filter(
      (m) => dayjs(m.date).format("YYYY-MM-DD") === dateStr
    );
  }, [selectedDate, myMemories]);

  // ── Events ──
  const eventDates = useMemo(() => {
    const map = new Map(); // dateStr → { colors: [] }
    events.forEach((e) => {
      const k = dayjs(e.date).format("YYYY-MM-DD");
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e.color || "#F5811F");
    });
    return map;
  }, [events]);

  const eventsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return events.filter(
      (e) => dayjs(e.date).format("YYYY-MM-DD") === dateStr
    );
  }, [selectedDate, events]);

  // ── Month Stats ──
  const monthStats = useMemo(() => {
    const start = selectedMonth.startOf("month");
    const end = selectedMonth.endOf("month");
    const inMonth = myMemories.filter((m) =>
      dayjs(m.date).isBetween(start, end, null, "[]")
    );
    const eventsInMonth = events.filter((e) =>
      dayjs(e.date).isBetween(start, end, null, "[]")
    );

    const byDay = {};
    inMonth.forEach((m) => {
      const k = dayjs(m.date).format("YYYY-MM-DD");
      byDay[k] = (byDay[k] || 0) + 1;
    });
    const busiest = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

    return {
      total: inMonth.length,
      activeDays: Object.keys(byDay).length,
      busiest: busiest
        ? { date: dayjs(busiest[0]).format("D MMM"), count: busiest[1] }
        : null,
      eventsCount: eventsInMonth.length,
    };
  }, [myMemories, events, selectedMonth]);

  const handleDayClick = (day) => {
    if (selectedDate && day.isSame(selectedDate, "day")) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
      // Auto-switch tab: past dates → memories, future dates → events
      const dateStr = day.format("YYYY-MM-DD");
      const hasEvents = eventDates.has(dateStr);
      const hasMemories = memoryDates.has(dateStr);
      const isPast = day.isBefore(TODAY, "day");
      if (isPast) {
        setActiveTab("memories");
      } else if (hasEvents && !hasMemories) {
        setActiveTab("events");
      } else {
        setActiveTab("memories");
      }
    }
  };

  const displayedMemories = useMemo(() => {
    const list = selectedDate ? memoriesForDate : myMemories;
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedDate, memoriesForDate, myMemories]);

  const displayedEvents = useMemo(() => {
    const list = selectedDate ? eventsForDate : events;
    return [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedDate, eventsForDate, events]);

  // ── Modal handlers ──
  const handleOpenCreate = () => {
    setEditEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event) => {
    setEditEvent(event);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Видалити цю подію?")) return;
    try {
      await deleteEvent(id);
    } catch {
      alert("Помилка при видаленні");
    }
  };

  const handleSave = async (formData) => {
    if (editEvent) {
      await updateEvent(editEvent._id, formData);
    } else {
      await createEvent(formData);
    }
    setActiveTab("events");
  };

  const memoriesTitle = selectedDate
    ? "Спогади за " + selectedDate.format("D MMMM YYYY")
    : "Всі спогади";

  const eventsTitle = selectedDate
    ? "Події на " + selectedDate.format("D MMMM YYYY")
    : "Всі заплановані події";

  if (!user) return <div className="mycal-loading">Завантаження...</div>;

  return (
    <div className="mycal-page">
      <div className="mycal-container">
        {/* Header */}
        <div className="mycal-header">
          <div className="mycal-header-left">
            <h1 className="mycal-title">Мій календар</h1>
            <p className="mycal-subtitle">Спогади і заплановані події в одному місці</p>
          </div>
          <div className="mycal-header-right">
            <button className="mycal-add-event-btn" onClick={handleOpenCreate}>
              <CalendarPlus size={18} strokeWidth={2} />
              Нова подія
            </button>
            <div className="mycal-user">
              <img
                src={
                  user.avatar
                    ? API_URL + "/uploads/" + user.avatar
                    : API_URL + "/uploads/default-avatar.png"
                }
                alt="avatar"
                className="mycal-avatar"
              />
              <div className="mycal-user-info">
                <span className="mycal-username">{user.fullName || user.username}</span>
                <span className="mycal-user-role">Профіль користувача</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mycal-stats-bar">
          <div className="mycal-stats-container">
            <div className="mycal-stat-item">
              <div className="mycal-stat-icon">
                <Camera size={20} strokeWidth={1.8} />
              </div>
              <div className="mycal-stat-content">
                <span className="mycal-stat-num">{monthStats.total}</span>
                <span className="mycal-stat-label">спогадів</span>
              </div>
            </div>
            <div className="mycal-stat-item mycal-stat-item--events">
              <div className="mycal-stat-icon mycal-stat-icon--events">
                <ListChecks size={20} strokeWidth={1.8} />
              </div>
              <div className="mycal-stat-content">
                <span className="mycal-stat-num">{monthStats.eventsCount}</span>
                <span className="mycal-stat-label">подій заплановано</span>
              </div>
            </div>
            <div className="mycal-stat-item">
              <div className="mycal-stat-icon">
                <CalendarDays size={20} strokeWidth={1.8} />
              </div>
              <div className="mycal-stat-content">
                <span className="mycal-stat-num">{monthStats.activeDays}</span>
                <span className="mycal-stat-label">активних днів</span>
              </div>
            </div>
            {monthStats.busiest && (
              <div className="mycal-stat-item">
                <div className="mycal-stat-icon">
                  <Flame size={20} strokeWidth={1.8} />
                </div>
                <div className="mycal-stat-content">
                  <span className="mycal-stat-num">{monthStats.busiest.date}</span>
                  <span className="mycal-stat-label">
                    найактивніший ({monthStats.busiest.count})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mycal-main-layout">
          {/* Sidebar */}
          <aside className="mycal-sidebar">
            <div className="mycal-calendar-card">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDayClick}
                  onMonthChange={(month) => setSelectedMonth(month)}
                  showDaysOutsideCurrentMonth
                  className="mycal-datecalendar"
                  slots={{
                    day: (props) => {
                      const { day, outsideCurrentMonth, ...other } = props;
                      const dateStr = day.format("YYYY-MM-DD");
                      const hasMemory =
                        !outsideCurrentMonth && memoryDates.has(dateStr);
                      const hasEvent =
                        !outsideCurrentMonth && eventDates.has(dateStr);
                      const isSelected =
                        selectedDate && day.isSame(selectedDate, "day");
                      const count = hasMemory
                        ? myMemories.filter(
                            (m) =>
                              dayjs(m.date).format("YYYY-MM-DD") === dateStr
                          ).length
                        : 0;
                      const intensityLevel = count > 3 ? 3 : count;
                      const eventColors = hasEvent ? eventDates.get(dateStr) : [];

                      return (
                        <div
                          className={`mycal-day-wrapper ${
                            hasMemory
                              ? `has-memory intensity-${intensityLevel} `
                              : ""
                          }${isSelected ? "selected " : ""}${
                            outsideCurrentMonth ? "outside" : ""
                          }${hasEvent ? " has-event" : ""}`}
                        >
                          <PickersDay
                            {...other}
                            day={day}
                            outsideCurrentMonth={outsideCurrentMonth}
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "12px",
                              fontSize: "0.95rem",
                              fontWeight: hasMemory ? 700 : 400,
                              background: "transparent !important",
                              color: outsideCurrentMonth
                                ? "rgba(110,90,133,0.3) !important"
                                : isSelected || count >= 3
                                ? "#fff !important"
                                : "inherit",
                              "&:hover": {
                                background:
                                  "rgba(89, 46, 131, 0.08) !important",
                              },
                              "&.Mui-selected": {
                                background: "transparent !important",
                              },
                            }}
                          />
                          {/* Event dots */}
                          {hasEvent && !isSelected && (
                            <div className="mycal-event-dots">
                              {eventColors.slice(0, 3).map((color, i) => (
                                <span
                                  key={i}
                                  className="mycal-event-dot"
                                  style={{ background: color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </LocalizationProvider>

              {/* Legend */}
              <div className="mycal-legend">
                <div className="mycal-legend-info">
                  <span className="mycal-legend-item">
                    <span className="mycal-dot" /> спогад
                  </span>
                  <span className="mycal-legend-item">
                    <span
                      className="mycal-dot"
                      style={{ background: "#F5811F" }}
                    />{" "}
                    подія
                  </span>
                  <span className="mycal-legend-item">
                    <span className="mycal-legend-selected" /> обрано
                  </span>
                </div>
                {selectedDate && (
                  <button
                    className="mycal-clear-btn"
                    onClick={() => setSelectedDate(null)}
                  >
                    Всі дні
                  </button>
                )}
              </div>

              {/* Quick add for selected date — only future */}
              {selectedDate && !selectedDate.isBefore(TODAY, "day") && (
                <button
                  className="mycal-quick-add-btn"
                  onClick={handleOpenCreate}
                >
                  <CalendarPlus size={16} strokeWidth={2} />
                  Додати подію на{" "}
                  {selectedDate.format("D MMM")}
                </button>
              )}
              {selectedDate && selectedDate.isBefore(TODAY, "day") && (
                <p className="mycal-past-date-hint">
                  Це минула дата — створи спогад замість події 📸
                </p>
              )}
            </div>
          </aside>

          {/* Content */}
          <main className="mycal-content">
            {/* Tabs */}
            <div className="mycal-tabs">
              <button
                className={`mycal-tab ${activeTab === "memories" ? "mycal-tab--active" : ""}`}
                onClick={() => setActiveTab("memories")}
              >
                <BookOpen size={16} strokeWidth={2} />
                {memoriesTitle}
                <span className="mycal-tab-count">{displayedMemories.length}</span>
              </button>
              <button
                className={`mycal-tab mycal-tab--events ${activeTab === "events" ? "mycal-tab--active mycal-tab--events-active" : ""}`}
                onClick={() => setActiveTab("events")}
              >
                <ListChecks size={16} strokeWidth={2} />
                {eventsTitle}
                <span className="mycal-tab-count mycal-tab-count--events">{displayedEvents.length}</span>
              </button>
            </div>

            {/* Memories panel */}
            {activeTab === "memories" && (
              <>
                {displayedMemories.length > 0 ? (
                  <div className="memories-grid">
                    {displayedMemories.map((memory) => (
                      <MemoryCard key={memory._id} memory={memory} />
                    ))}
                  </div>
                ) : (
                  <div className="mycal-empty-state">
                    <Inbox
                      size={40}
                      strokeWidth={1.2}
                      className="mycal-empty-icon"
                    />
                    <p>
                      {selectedDate
                        ? "На цю дату спогадів не знайдено."
                        : "У вас поки немає спогадів."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Events panel */}
            {activeTab === "events" && (
              <>
                {displayedEvents.length > 0 ? (
                  <div className="mycal-events-list">
                    {displayedEvents.map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mycal-empty-state">
                    <CalendarPlus
                      size={40}
                      strokeWidth={1.2}
                      className="mycal-empty-icon"
                    />
                    <p>
                      {selectedDate
                        ? "На цю дату подій не заплановано."
                        : "У вас ще немає запланованих подій."}
                    </p>
                    <button
                      className="mycal-empty-cta"
                      onClick={handleOpenCreate}
                    >
                      <CalendarPlus size={16} strokeWidth={2} />
                      Запланувати першу подію
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      <CreateEventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEvent(null);
        }}
        onSave={handleSave}
        initialDate={selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}
        editEvent={editEvent}
      />
    </div>
  );
}
