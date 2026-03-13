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
          slots={{
            day: (props) => {
              const { day, outsideCurrentMonth, ...other } = props;
              // Перевіряємо наявність спогаду
              const hasMemory = !outsideCurrentMonth && checkHasMemory(day);

              return (
                <PickersDay
                  {...other}
                  day={day}
                  outsideCurrentMonth={outsideCurrentMonth}
                  sx={{
                    ...(hasMemory && {
                      backgroundColor: "#FFCC00 !important",
                      color: "#000 !important",
                      fontWeight: "bold",
                      borderRadius: "50%",
                    }),
                    '&.Mui-selected': { 
                      backgroundColor: "#F5811F !important", 
                      color: "#fff !important" 
                    },
                  }}
                />
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
          className="btn btn-sm btn-outline-secondary mt-2 w-100"
        >
          Показати всі спогади
        </button>
      )}
    </div>
  );
}