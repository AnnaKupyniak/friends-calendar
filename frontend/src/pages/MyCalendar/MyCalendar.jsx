import { useContext, useMemo, useState } from "react";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/uk";
import isBetween from "dayjs/plugin/isBetween";

import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import { MemoriesContext } from "../../context/MemoriesContext";
import MemoryCard from "../../features/memories/MemoryCard";
import "./MyCalendar.css";

dayjs.extend(isBetween);
dayjs.locale("uk");

const API_URL = import.meta.env.VITE_API_URL;

export default function MyCalendar() {
  const { user } = useContext(AuthContext);
  const { friendships = [], groups = [] } = useContext(FriendsContext);
  const { memories = [] } = useContext(MemoriesContext);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  if (!user) return <div className="mycal-loading">Завантаження...</div>;

  // Всі мої спогади (де я учасник)
  const myMemories = useMemo(() => {
    return memories.filter((m) => {
      return (
        String(m.createdBy) === String(user._id) ||
        String(m.entity) === String(user._id) ||
        friendships.some((f) => String(f._id) === String(m.entity)) ||
        groups.some((g) => String(g._id) === String(m.entity))
      );
    });
  }, [memories, user._id, friendships, groups]);

  // Дати що мають спогади (для підсвічування)
  const memoryDates = useMemo(() => {
    const set = new Set();
    myMemories.forEach((m) => set.add(dayjs(m.date).format("YYYY-MM-DD")));
    return set;
  }, [myMemories]);

  // Спогади на обрану дату
  const memoriesForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return myMemories.filter(
      (m) => dayjs(m.date).format("YYYY-MM-DD") === dateStr
    );
  }, [selectedDate, myMemories]);

  // Статистика поточного місяця
  const monthStats = useMemo(() => {
    const start = selectedMonth.startOf("month");
    const end = selectedMonth.endOf("month");
    const inMonth = myMemories.filter((m) =>
      dayjs(m.date).isBetween(start, end, null, "[]")
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
    };
  }, [myMemories, selectedMonth]);

  const handleDayClick = (day) => {
    if (selectedDate && day.isSame(selectedDate, "day")) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  const displayedMemories = useMemo(() => {
    const list = selectedDate ? memoriesForDate : myMemories;
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedDate, memoriesForDate, myMemories]);

  const memoriesTitle = selectedDate 
    ? "Спогади за " + selectedDate.format("D MMMM YYYY")
    : "Всі спогади";

  return (
    <div className="mycal-page">
      <div className="mycal-container">
        {/* -- Header -- */}
        <div className="mycal-header">
          <div className="mycal-header-left">
            <h1 className="mycal-title">Мій календар</h1>
            <p className="mycal-subtitle">Всі ваші спільні моменти в одному місці</p>
          </div>
          <div className="mycal-user">
            <img
              src={user.avatar ? API_URL + "/uploads/" + user.avatar : API_URL + "/uploads/default-avatar.png"}
              alt="avatar"
              className="mycal-avatar"
            />
            <div className="mycal-user-info">
              <span className="mycal-username">{user.fullName || user.username}</span>
              <span className="mycal-user-role">Профіль користувача</span>
            </div>
          </div>
        </div>

        {/* -- Stats -- */}
        <div className="mycal-stats-bar">
          <div className="mycal-stats-container">
            <div className="mycal-stat-item">
              <div className="mycal-stat-icon">📸</div>
              <div className="mycal-stat-content">
                <span className="mycal-stat-num">{monthStats.total}</span>
                <span className="mycal-stat-label">спогадів</span>
              </div>
            </div>
            <div className="mycal-stat-item">
              <div className="mycal-stat-icon">🗓️</div>
              <div className="mycal-stat-content">
                <span className="mycal-stat-num">{monthStats.activeDays}</span>
                <span className="mycal-stat-label">активних днів</span>
              </div>
            </div>
            {monthStats.busiest && (
              <div className="mycal-stat-item">
                <div className="mycal-stat-icon">🔥</div>
                <div className="mycal-stat-content">
                  <span className="mycal-stat-num">{monthStats.busiest.date}</span>
                  <span className="mycal-stat-label">найактивніший ({monthStats.busiest.count})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mycal-main-layout">
          {/* -- Sidebar -- */}
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
                      const hasMemory = !outsideCurrentMonth && memoryDates.has(dateStr);
                      const isSelected = selectedDate && day.isSame(selectedDate, "day");
                      const count = hasMemory ? myMemories.filter(m => dayjs(m.date).format("YYYY-MM-DD") === dateStr).length : 0;

                      return (
                        <div className={"mycal-day-wrapper " + (hasMemory ? "has-memory " : "") + (isSelected ? "selected " : "") + (outsideCurrentMonth ? "outside" : "")}>
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
                              color: outsideCurrentMonth ? "rgba(110,90,133,0.3) !important" : isSelected ? "#fff !important" : hasMemory ? "#F5811F !important" : "inherit",
                              "&:hover": { background: "rgba(245,129,31,0.1) !important" },
                              "&.Mui-selected": { background: "transparent !important" },
                            }}
                          />
                          {hasMemory && (
                            <div className="mycal-dot-row">
                              {Array.from({ length: Math.min(count, 3) }).map((_, i) => <span key={i} className="mycal-dot" />)}
                              {count > 3 && <span className="mycal-dot-more">+</span>}
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </LocalizationProvider>

              <div className="mycal-legend">
                <div className="mycal-legend-info">
                  <span className="mycal-legend-item"><span className="mycal-dot" /> спогад</span>
                  <span className="mycal-legend-item"><span className="mycal-legend-selected" /> обрано</span>
                </div>
                {selectedDate && <button className="mycal-clear-btn" onClick={() => setSelectedDate(null)}>Всі дні</button>}
              </div>
            </div>
          </aside>

          {/* -- Content -- */}
          <main className="mycal-content">
            <div className="mycal-content-header">
              <h2 className="mycal-content-title">{memoriesTitle}</h2>
              <span className="mycal-content-count">{displayedMemories.length} спогадів</span>
            </div>

            {displayedMemories.length > 0 ? (
              <div className="mycal-memories-grid">
                {displayedMemories.map((memory) => <MemoryCard key={memory._id} memory={memory} />)}
              </div>
            ) : (
              <div className="mycal-empty-state">
                <span className="mycal-empty-icon">📭</span>
                <p>{selectedDate ? "На цю дату спогадів не знайдено." : "У вас поки немає спогадів."}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
