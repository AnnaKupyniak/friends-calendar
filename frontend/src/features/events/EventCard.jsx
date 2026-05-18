import { Calendar, Clock, MapPin, Pencil, Trash2, Users } from "lucide-react";
import dayjs from "dayjs";
import "./Events.css";

export default function EventCard({ event, onEdit, onDelete, compact = false }) {
  const dateObj = dayjs(event.date);
  const isPast = dateObj.isBefore(dayjs(), "day");

  return (
    <div
      className={`event-card ${compact ? "event-card--compact" : ""} ${isPast ? "event-card--past" : ""}`}
      style={{ "--event-color": event.color || "#F5811F" }}
    >
      <div className="event-card__body">
        <div className="event-card__top">
          <span className="event-card__type-badge">
            <Users size={12} strokeWidth={2.5} />
            {event.entityType === "Friendship" ? "Особиста" : "Групова"}
          </span>
          {isPast && <span className="event-card__past-badge">Минула</span>}
        </div>

        <h3 className="event-card__title">{event.title}</h3>

        {event.description && !compact && (
          <p className="event-card__desc">{event.description}</p>
        )}

        <div className="event-card__meta">
          <span className="event-card__meta-item">
            <Calendar size={14} strokeWidth={2} />
            {dateObj.format("D MMMM YYYY")}
          </span>
          {event.time && (
            <span className="event-card__meta-item">
              <Clock size={14} strokeWidth={2} />
              {event.time}
            </span>
          )}
          {event.place && (
            <span className="event-card__meta-item">
              <MapPin size={14} strokeWidth={2} />
              {event.place}
            </span>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="event-card__actions">
            {onEdit && (
              <button
                className="event-card__btn event-card__btn--edit"
                onClick={() => onEdit(event)}
                title="Редагувати"
              >
                <Pencil size={15} strokeWidth={2} />
                Редагувати
              </button>
            )}
            {onDelete && (
              <button
                className="event-card__btn event-card__btn--delete"
                onClick={() => onDelete(event._id)}
                title="Видалити"
              >
                <Trash2 size={15} strokeWidth={2} />
                Видалити
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
