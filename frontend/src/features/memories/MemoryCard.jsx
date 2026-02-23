import { useContext, useState } from "react";
import { MemoriesContext } from "../../context/MemoriesContext";
import "./MemoryCard.css";

export default function MemoryCard({ memory }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { deleteMemory, updateMemory } = useContext(MemoriesContext);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: memory.title,
    description: memory.description,
    date: memory.date.slice(0, 10),
    place: memory.place,
    category: memory.category || "",
  });

  const imageUrl = memory.imageUrl
    ? memory.imageUrl.startsWith("http")
      ? memory.imageUrl
      : `${API_URL.split("/api")[0]}/${memory.imageUrl.replace(/^\/+/, "")}`
    : null;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleChange = (e) => {
    const { value, name } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateMemory(memory._id, formData);
    setIsEditing(false);
  };

  return (
    <article className="memory-card">
      {imageUrl && (
        <div className="memory-image">
          <img src={imageUrl} alt={memory.title} />
        </div>
      )}

      <div className="memory-content">
        {isEditing ? (
          <div className="edit-form">
            <input
              className="modern-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Назва"
            />

            <div className="input-group-row">
              <input
                type="date"
                className="modern-input"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />

              <input
                className="modern-input"
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="Місце"
              />
            </div>

            <input
              className="modern-input"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Категорія"
            />

            <textarea
              className="modern-input"
              rows="3"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опис спогаду..."
            />

            <div className="button-group">
              <button className="btn-save" onClick={handleSave}>
                Зберегти
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="memory-header">
              <h3 className="memory-title">{memory.title}</h3>
              {memory.category && (
                <span className="category-badge">{memory.category}</span>
              )}
            </div>

            <div className="memory-meta">
              <span>{formatDate(memory.date)}</span>
              <span>{memory.place}</span>
            </div>

            <p className="memory-description">{memory.description}</p>

            <footer className="memory-footer">
              <div className="memory-actions">
                <button
                  className="action-link edit"
                  onClick={() => setIsEditing(true)}
                >
                  Редагувати
                </button>
                <button
                  className="action-link delete"
                  onClick={() => deleteMemory(memory._id)}
                >
                  Видалити
                </button>
              </div>

              <span className="memory-created">
                Додано: {new Date(memory.createdAt).toLocaleDateString("uk-UA")}
              </span>
            </footer>
          </>
        )}
      </div>
    </article>
  );
}
