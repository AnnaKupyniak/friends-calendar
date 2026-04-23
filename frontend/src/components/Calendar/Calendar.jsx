import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useContext, useEffect, useMemo, useCallback } from "react";

import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import "./Calendar.css";

export default function Calendar({ currentUser = null }) {
  const [value, setValue] = useState(null);
  const { selectedEntity } = useContext(FriendsContext);
  const { memories, setSelectedDate } = useContext(MemoriesContext);
  // Додайте це в деструктуризацію useContext на початку Calendar.jsx
const { friendships, groups } = useContext(FriendsContext);

  // Визначаємо поточну сутність
  const entity = useMemo(() => {
    if (currentUser) {
      return { type: "friend", data: currentUser };
    }
    return selectedEntity;
  }, [selectedEntity, currentUser]);

  // Отримуємо чистий ID для порівняння
  const currentId = entity?.data?._id || entity?._id;

  useEffect(() => {
    setValue(null);
    setSelectedDate(null);
  }, [currentId, setSelectedDate]);

  const handleDateChange = (newValue) => {
    if (value && newValue && newValue.isSame(value, "day")) {
      setValue(null);
      setSelectedDate(null);
    } else {
      setValue(newValue);
      setSelectedDate(newValue ? newValue.format("YYYY-MM-DD") : null);
    }
  };
const checkHasMemory = useCallback((day) => {
  if (!memories || !entity || !currentId) return false;
  
  const dayStr = day.format('YYYY-MM-DD');

  return memories.some((m) => {
    const memoryDate = dayjs(m.date).format('YYYY-MM-DD');
    if (memoryDate !== dayStr) return false;

    // РЕЖИМ ПРОФІЛЮ (currentUser передано)
    // Показуємо ВСІ спогади, де користувач є учасником (як автор або як частина сутності)
    if (currentUser) {
      return (
        String(m.createdBy) === String(currentId) || // Створено мною
        String(m.entity) === String(currentId) ||    // Стосується мене (User)
        friendships.some(f => String(f._id) === String(m.entity)) || // Стосується моїх дружб
        groups.some(g => String(g._id) === String(m.entity)) // Стосується моїх груп
      );
    }

    // РЕЖИМ HOME (працює як раніше - фільтр по конкретному обраному об'єкту)
    if (entity.type === "friend") {
      return (
        (m.entityType === "Friendship" || m.entityType === "User") && 
        (String(m.entity) === String(currentId) || String(m.entityUserId) === String(currentId))
      );
    } 
    if (entity.type === "group") {
      return m.entityType === "Group" && String(m.entity) === String(currentId);
    }

    return false;
  });
}, [memories, entity, currentId, currentUser, friendships, groups]);

  // Використовуємо slotProps для передачі функції перевірки в рендер дня
  return (
    <div className="calendar-container">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar 
          value={value} 
          onChange={handleDateChange} 
          showDaysOutsideCurrentMonth
          slots={{
            day: (props) => {
              const { day, outsideCurrentMonth, ...other } = props;
              const hasMemory = !outsideCurrentMonth && checkHasMemory(day);
              const isSelected = value && day.isSame(value, "day");

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
                      fontSize: "0.85rem",
                      fontWeight: hasMemory ? 700 : 400,
                      background: "transparent !important",
                      color: outsideCurrentMonth ? "rgba(110,90,133,0.3) !important" : isSelected ? "#fff !important" : hasMemory ? "#F5811F !important" : "inherit",
                      "&:hover": { background: "rgba(245,129,31,0.1) !important" },
                      "&.Mui-selected": { background: "transparent !important" },
                    }}
                  />
                  {hasMemory && (
                    <div className="mycal-dot-row">
                      <span className="mycal-dot" />
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </LocalizationProvider>

      {value && (
        <button
          onClick={() => {
            setValue(null);
            setSelectedDate(null); 
          }}
          className="show-all-btn"
        >
          Показати всі спогади
        </button>
      )}
    </div>
  );
}