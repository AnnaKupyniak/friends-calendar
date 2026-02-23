import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useContext, useEffect, useMemo } from "react";

import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import "./Calendar.css";

const entityTypeMap = {
  friend: "Friendship",
  group: "Group",
};

function CustomDay(props) {
  const { day, outsideCurrentMonth, ...other } = props;
  const { selectedEntity } = useContext(FriendsContext);
  const { memories } = useContext(MemoriesContext);

  const hasMemory = useMemo(() => {
    if (!selectedEntity || !memories) return false;
    const entityType = entityTypeMap[selectedEntity.type];
    const entityId = selectedEntity.data._id;
    return memories.some(
      (m) =>
        m.entityType === entityType &&
        m.entity === entityId &&
        dayjs(m.date).isSame(day, "day"),
    );
  }, [day, selectedEntity, memories]);

  return (
    <PickersDay
      {...other}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      sx={{
        backgroundColor: hasMemory ? "#FFCC00" : undefined,
        color: hasMemory ? "#000" : undefined,
        "&.Mui-selected": {
          backgroundColor: "#F5811F !important",
          color: "#fff",
        },
        "&:hover": {
          backgroundColor: hasMemory ? "#F5811F" : undefined,
        },
      }}
    />
  );
}

export default function Calendar() {
  const [value, setValue] = useState(null);
  const { selectedEntity } = useContext(FriendsContext);
  const { setSelectedDate } = useContext(MemoriesContext);

  useEffect(() => {
    setValue(null);
    setSelectedDate(null);
  }, [selectedEntity, setSelectedDate]);

  if (!selectedEntity) return null;

  const handleDateChange = (newValue) => {
    if (!newValue) return;
    if (value && newValue.isSame(value, "day")) {
      setValue(null);
      setSelectedDate(null);
    } else {
      setValue(newValue);
      setSelectedDate(newValue.format("YYYY-MM-DD"));
    }
  };

  return (
    <div className="calendar-container">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={value}
          onChange={handleDateChange}
          slots={{ day: CustomDay }}
          sx={{
            height: "fit-content",
            maxHeight: "310px",

            "& .MuiDayCalendar-header": {
              marginBottom: "0px",
            },
            "& .MuiPickersSlideTransition-root": {
              minHeight: "200px",
            },
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
