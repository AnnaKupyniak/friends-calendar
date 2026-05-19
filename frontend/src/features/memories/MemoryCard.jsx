import { useContext, useState, useRef } from "react";
import { MemoriesContext } from "../../context/MemoriesContext";
import Button from "../../components/Button/Button";
import "./MemoryCard.css";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, MessageCircle, Pencil, Trash2 } from "lucide-react";

export default function MemoryCard({ memory }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { deleteMemory, updateMemory } = useContext(MemoriesContext);

  const [isEditing, setIsEditing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const imageContainerRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Стан для нових файлів

  const [formData, setFormData] = useState({
    title: memory.title,
    description: memory.description,
    date: memory.date.slice(0, 10),
    place: memory.place,
    category: memory.category || "",
  });

  const navigate = useNavigate();

  const getImageUrls = () => {
    const baseUrl = API_URL.split("/api")[0];

    if (memory.imageUrls && memory.imageUrls.length > 0) {
      return memory.imageUrls.map((url) =>
        url.startsWith("http") ? url : `${baseUrl}/${url.replace(/^\/+/, "")}`,
      );
    }

    if (memory.imageUrl) {
      const url = memory.imageUrl.startsWith("http")
        ? memory.imageUrl
        : `${baseUrl}/${memory.imageUrl.replace(/^\/+/, "")}`;
      return [url];
    }

    return [];
  };

  const imageUrls = getImageUrls();

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

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Перетворюємо FileList у масив
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSave = async () => {
    try {
      // Передаємо дані та вибрані файли в контекст
      await updateMemory(memory._id, formData, selectedFiles);
      setIsEditing(false);
      setSelectedFiles([]); // Очищаємо список файлів після успіху
    } catch (err) {
      console.error("Failed to update memory", err);
    }
  };

  const prevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + imageUrls.length) % imageUrls.length,
    );

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);

  const handleImageClick = (e) => {
    // If user clicks left half -> prev, right half -> next
    const el = imageContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.45) prevImage();
    else if (x > rect.width * 0.55) nextImage();
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX == null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const dx = touchEndX - touchStartX;
    const threshold = 40; // px
    if (dx > threshold) prevImage();
    else if (dx < -threshold) nextImage();
    setTouchStartX(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
  };

  return (
    <article className="memory-card">
      {imageUrls.length > 0 && (
        <div
          className="memory-image"
          ref={imageContainerRef}
          onClick={handleImageClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={`Галерея спогаду: зображення ${currentImageIndex + 1} з ${imageUrls.length}`}
        >
          <img src={imageUrls[currentImageIndex]} alt={memory.title} />

          {imageUrls.length > 1 && (
            <div className="image-navigation">
              <span className="image-counter">
                {currentImageIndex + 1} / {imageUrls.length}
              </span>
            </div>
          )}
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

            {/* Секція вибору нових фото */}
            <div className="file-edit-section">
              <label className="file-label">Оновити фотографії:</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="modern-input"
              />
              {selectedFiles.length > 0 && (
                <p className="file-status">Вибрано файлів: {selectedFiles.length}</p>
              )}
            </div>

            <div className="button-group">
              <Button
                variant="primary"
                onClick={handleSave}
              >
                Зберегти
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedFiles([]);
                }}
              >
                Скасувати
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="memory-header">
              <div className="memory-title-wrap">
                <h3 className="memory-title">{memory.title}</h3>
                <div className="memory-meta">
                  <span className="memory-meta-item">
                    <CalendarDays size={13} className="meta-icon" />
                    {formatDate(memory.date)}
                  </span>
                  <span className="memory-meta-item">
                    <MapPin size={13} className="meta-icon" />
                    {memory.place}
                  </span>
                </div>
              </div>
              {memory.category && (
                <span className="category-badge">{memory.category}</span>
              )}
            </div>

            <p className="memory-description">{memory.description}</p>

            <div className="memory-footer">
              <button
                className="comments-btn-refined"
                onClick={() => navigate(`/comments/${memory._id}`)}
              >
                <MessageCircle size={14} />
                <span>Коментарі</span>
              </button>

              <div className="action-buttons-wrap">
                <button
                  className="action-icon-circle edit"
                  onClick={() => setIsEditing(true)}
                  title="Редагувати"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="action-icon-circle delete"
                  onClick={() => deleteMemory(memory._id)}
                  title="Видалити"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}