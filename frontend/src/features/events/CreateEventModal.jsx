import { useContext, useEffect, useState } from "react";
import { X, CalendarPlus, MapPin, Clock, AlignLeft, Palette, Users } from "lucide-react";
import { FriendsContext } from "../../context/FriendsContext";
import "./Events.css";
import "./CreateEventModal.css";

const PRESET_COLORS = [
  "#F5811F", "#592E83", "#10B981", "#3B82F6",
  "#F43F5E", "#8B5CF6", "#F59E0B", "#14B8A6",
];

export default function CreateEventModal({ isOpen, onClose, onSave, initialDate, editEvent, defaultEntity }) {
  const { friendships = [], groups = [] } = useContext(FriendsContext);
  const { user } = useContext(FriendsContext);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    place: "",
    color: "#F5811F",
    entityType: "Friendship",
    entity: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editEvent) {
      setForm({
        title: editEvent.title || "",
        description: editEvent.description || "",
        date: editEvent.date ? editEvent.date.slice(0, 10) : "",
        time: editEvent.time || "",
        place: editEvent.place || "",
        color: editEvent.color || "#F5811F",
        entityType: editEvent.entityType || "Friendship",
        entity: editEvent.entity || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        date: initialDate || "",
        time: "",
        place: "",
        color: "#F5811F",
        entityType: defaultEntity?.entityType || "Friendship",
        entity: defaultEntity?.entity ? String(defaultEntity.entity) : "",
      });
    }
    setError("");
  }, [editEvent, initialDate, isOpen, defaultEntity]);

  if (!isOpen) return null;

  const entityOptions =
    form.entityType === "Friendship"
      ? friendships.map((f) => {
          const other = f.users?.find((u) => u._id !== user?._id) || f.users?.[0];
          return { value: f._id, label: other?.fullName || other?.username || "Друг" };
        })
      : groups.map((g) => ({ value: g._id, label: g.name }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "entityType") setForm((prev) => ({ ...prev, [name]: value, entity: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Введіть назву події");
    if (!form.date) return setError("Оберіть дату");
    // Перевірка: дата не може бути в минулому (дозволяємо сьогодні і майбутнє)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(form.date);
    if (!editEvent && chosenDate < today) {
      return setError("Не можна планувати подію на минулу дату. Для минулих дат — додай спогад!");
    }
    if (!form.entity) return setError("Оберіть друга або групу");
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cem-modal">
        <button className="cem-close" onClick={onClose}><X size={20} /></button>

        <div className="cem-header">
          <div className="cem-icon"><CalendarPlus size={22} strokeWidth={1.8} /></div>
          <div>
            <h2 className="cem-title">{editEvent ? "Редагувати подію" : "Нова подія"}</h2>
            <p className="cem-subtitle">Заплануй зустріч з друзями</p>
          </div>
        </div>

        <form className="cem-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="cem-field">
            <label className="cem-label">Назва події *</label>
            <input
              className="cem-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Наприклад: Похід у кіно"
              maxLength={80}
            />
          </div>

          {/* Date + Time */}
          <div className="cem-row">
            <div className="cem-field">
              <label className="cem-label">
                <CalendarPlus size={14} /> Дата *
              </label>
              <input
                className="cem-input"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={editEvent ? undefined : new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="cem-field">
              <label className="cem-label">
                <Clock size={14} /> Час
              </label>
              <input
                className="cem-input"
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Place */}
          <div className="cem-field">
            <label className="cem-label">
              <MapPin size={14} /> Місце
            </label>
            <input
              className="cem-input"
              name="place"
              value={form.place}
              onChange={handleChange}
              placeholder="Наприклад: Кав'ярня Барвінок"
            />
          </div>

          {/* Description */}
          <div className="cem-field">
            <label className="cem-label">
              <AlignLeft size={14} /> Опис
            </label>
            <textarea
              className="cem-input cem-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Додаткові деталі..."
              rows={3}
            />
          </div>

          {/* Entity type + entity */}
          <div className="cem-row">
            <div className="cem-field">
              <label className="cem-label">
                <Users size={14} /> Тип
              </label>
              <select
                className="cem-input"
                name="entityType"
                value={form.entityType}
                onChange={handleChange}
              >
                <option value="Friendship">Друг</option>
                <option value="Group">Група</option>
              </select>
            </div>
            <div className="cem-field">
              <label className="cem-label">
                {form.entityType === "Friendship" ? "Друг *" : "Група *"}
              </label>
              <select
                className="cem-input"
                name="entity"
                value={form.entity}
                onChange={handleChange}
              >
                <option value="">— оберіть —</option>
                {entityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div className="cem-field">
            <label className="cem-label">
              <Palette size={14} /> Колір
            </label>
            <div className="cem-colors">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cem-color-dot ${form.color === c ? "cem-color-dot--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                />
              ))}
            </div>
          </div>

          {error && <p className="cem-error">{error}</p>}

          <div className="cem-footer">
            <button type="button" className="cem-btn-cancel" onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="cem-btn-save" disabled={saving}>
              {saving ? "Збереження..." : editEvent ? "Зберегти зміни" : "Створити подію"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
