import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { CalendarPlus } from "lucide-react";

import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import { EventsContext } from "../../context/EventsContext.jsx";
import CreateEventModal from "../../features/events/CreateEventModal.jsx";
import "./Calendar.css";

const TODAY = dayjs().startOf("day");

export default function Calendar({ currentUser = null }) {
  const [value, setValue] = useState(null);
  const { selectedEntity } = useContext(FriendsContext);
  const { memories, setSelectedDate } = useContext(MemoriesContext);
  const { friendships, groups } = useContext(FriendsContext);
  const { events = [], createEvent, updateEvent, deleteEvent } = useContext(EventsContext);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  // Визначаємо поточну сутність
  const entity = useMemo(() => {
    if (currentUser) {
      return { type: "friend", data: currentUser };
    }
    return selectedEntity;
  }, [selectedEntity, currentUser]);

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

  const getMemoryCount = useCallback(
    (day) => {
      if (!memories || !entity || !currentId) return 0;
      const dayStr = day.format("YYYY-MM-DD");
      return memories.filter((m) => {
        const memoryDate = dayjs(m.date).format("YYYY-MM-DD");
        if (memoryDate !== dayStr) return false;
        if (currentUser) {
          return (
            String(m.createdBy) === String(currentId) ||
            String(m.entity) === String(currentId) ||
            friendships.some((f) => String(f._id) === String(m.entity)) ||
            groups.some((g) => String(g._id) === String(m.entity))
          );
        }
        if (entity.type === "friend") {
          return (
            (m.entityType === "Friendship" || m.entityType === "User") &&
            (String(m.entity) === String(currentId) ||
              String(m.entityUserId) === String(currentId))
          );
        }
        if (entity.type === "group") {
          return (
            m.entityType === "Group" && String(m.entity) === String(currentId)
          );
        }
        return false;
      }).length;
    },
    [memories, entity, currentId, currentUser, friendships, groups]
  );

  const getMemoryImage = useCallback(
    (day) => {
      if (!memories || !entity || !currentId) return null;
      const dayStr = day.format("YYYY-MM-DD");
      const dayMemories = memories.filter((m) => {
        const memoryDate = dayjs(m.date).format("YYYY-MM-DD");
        if (memoryDate !== dayStr) return false;
        if (currentUser) {
          return (
            String(m.createdBy) === String(currentId) ||
            String(m.entity) === String(currentId) ||
            friendships.some((f) => String(f._id) === String(m.entity)) ||
            groups.some((g) => String(g._id) === String(m.entity))
          );
        }
        if (entity.type === "friend") {
          return (
            (m.entityType === "Friendship" || m.entityType === "User") &&
            (String(m.entity) === String(currentId) ||
              String(m.entityUserId) === String(currentId))
          );
        }
        if (entity.type === "group") {
          return (
            m.entityType === "Group" && String(m.entity) === String(currentId)
          );
        }
        return false;
      });

      const memoryWithImage = dayMemories.find(
        (m) => m.imageUrl || (m.imageUrls && m.imageUrls.length > 0)
      );
      if (!memoryWithImage) return null;

      const API_URL = import.meta.env.VITE_API_URL;
      const baseUrl = API_URL.split("/api")[0];
      const imgPath = memoryWithImage.imageUrl || memoryWithImage.imageUrls[0];
      return imgPath.startsWith("http")
        ? imgPath
        : `${baseUrl}/${imgPath.replace(/^\/+/, "")}`;
    },
    [memories, entity, currentId, currentUser, friendships, groups]
  );

  // Events for the selected entity
  const entityEventDates = useMemo(() => {
    if (!currentId || !entity) return new Map();
    const map = new Map();
    events.forEach((e) => {
      const isForEntity =
        String(e.entity) === String(currentId) ||
        (entity.type === "friend" &&
          friendships.some(
            (f) => String(f._id) === String(e.entity) && String(f._id) === String(currentId)
          ));
      if (isForEntity) {
        const k = dayjs(e.date).format("YYYY-MM-DD");
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(e.color || "#F5811F");
      }
    });
    return map;
  }, [events, currentId, entity, friendships]);

  // Is selected date in the future?
  const isFutureDate = value && dayjs(value).startOf("day").isAfter(TODAY.subtract(1, "day"));
  const isToday = value && dayjs(value).isSame(TODAY, "day");
  const canPlanEvent = isFutureDate && !isToday || (value && dayjs(value).isAfter(TODAY));

  // Pre-fill entity for modal
  const modalDefaultEntity = useMemo(() => {
    if (!entity || !currentId) return null;
    if (entity.type === "friend") {
      const friendship = friendships.find((f) => String(f._id) === String(currentId));
      return friendship
        ? { entityType: "Friendship", entity: friendship._id }
        : null;
    }
    if (entity.type === "group") {
      return { entityType: "Group", entity: currentId };
    }
    return null;
  }, [entity, currentId, friendships]);

  const handleSave = async (formData) => {
    if (editEvent) {
      await updateEvent(editEvent._id, formData);
    } else {
      await createEvent(formData);
    }
  };

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
              const count = !outsideCurrentMonth ? getMemoryCount(day) : 0;
              const hasMemory = count > 0;
              const isSelected = value && day.isSame(value, "day");
              const intensityLevel = count > 3 ? 3 : count;
              const dateStr = day.format("YYYY-MM-DD");
              const hasEvent = !outsideCurrentMonth && entityEventDates.has(dateStr);
              const eventColors = hasEvent ? entityEventDates.get(dateStr) : [];
              const isFuture = !outsideCurrentMonth && day.isAfter(TODAY);
              const memoryImage = !outsideCurrentMonth ? getMemoryImage(day) : null;

              return (
                <div
                  className={`mycal-day-wrapper ${
                    hasMemory ? `has-memory intensity-${intensityLevel} ` : ""
                  }${memoryImage ? "has-photo-memory " : ""}${isSelected ? "selected " : ""}${
                    outsideCurrentMonth ? "outside" : ""
                  }${hasEvent ? " has-event" : ""}${isFuture ? " future-day" : ""}`}
                  style={
                    memoryImage
                      ? {
                          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.45)), url(${memoryImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}
                  }
                >
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
                      color: outsideCurrentMonth
                        ? "rgba(110,90,133,0.3) !important"
                        : isSelected || count >= 3 || memoryImage
                        ? "#fff !important"
                        : "inherit",
                      "&:hover": {
                        background: memoryImage
                          ? "transparent !important"
                          : "rgba(89, 46, 131, 0.08) !important",
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

      {/* Show-all button */}
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

      {/* Plan event button — only for future dates */}
      {value && canPlanEvent && (
        <button
          className="cal-plan-event-btn"
          onClick={() => {
            setEditEvent(null);
            setModalOpen(true);
          }}
        >
          <CalendarPlus size={15} strokeWidth={2.2} />
          Запланувати подію на {dayjs(value).format("D MMM")}
        </button>
      )}

      {/* Past date hint */}
      {value && !canPlanEvent && (
        <p className="cal-past-hint">
          Це вже минула дата — додай спогад замість події 📸
        </p>
      )}

      <CreateEventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEvent(null);
        }}
        onSave={handleSave}
        initialDate={value ? dayjs(value).format("YYYY-MM-DD") : ""}
        editEvent={editEvent}
        defaultEntity={modalDefaultEntity}
      />
    </div>
  );
}