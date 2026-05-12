import { useContext, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";

export default function CreateMemory({ onClose }) {
  const { selectedEntity, addCategoryToFriendship, addCategoryToGroup } =
    useContext(FriendsContext);
  const { createMemory } = useContext(MemoriesContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityTypeMap = {
    friend: "Friendship",
    group: "Group",
  };

  const getEntityName = () => {
    if (!selectedEntity) return "";
    if (selectedEntity.type === "friend") {
      return (
        selectedEntity.data.user?.fullName || selectedEntity.data.user?.username
      );
    }
    return selectedEntity.data.name;
  };

  async function ensureCategoryExists(categoryName) {
    if (!categoryName || !selectedEntity) return;

    const existingCategories = selectedEntity.data.categories || [];

    const categoryExists = existingCategories.some(
      (cat) => cat.toLowerCase() === categoryName.toLowerCase(),
    );

    if (!categoryExists && categoryName.trim()) {
      try {
        if (selectedEntity.type === "friend") {
          await addCategoryToFriendship(selectedEntity.data._id, categoryName);
        } else if (selectedEntity.type === "group") {
          await addCategoryToGroup(selectedEntity.data._id, categoryName);
        }
      } catch (error) {
        console.error("Error adding category:", error);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    const categoryValue = event.target.category.value;

    formData.append("entityId", selectedEntity.data._id);
    formData.append("entityType", entityTypeMap[selectedEntity.type]);
    formData.append("title", event.target.title.value);
    formData.append("date", event.target.date.value);
    formData.append("place", event.target.place.value);
    formData.append("category", categoryValue || "");
    formData.append("description", event.target.description.value);

    // Додаємо всі вибрані файли
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });
    }

    try {
      await createMemory(formData);

      if (categoryValue && categoryValue.trim()) {
        await ensureCategoryExists(categoryValue);
      }

      onClose();
    } catch (error) {
      console.error("Error creating memory:", error);
      alert("Помилка при створенні спогаду");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  }

  function removeFile(indexToRemove) {
    setSelectedFiles(
      selectedFiles.filter((_, index) => index !== indexToRemove),
    );
  }

  return (
    <div className="new-group-modal">
      <div className="modal-header">
        <h2 className="mycal-content-title">Додати спогад</h2>
        <p className="mycal-subtitle">Збережіть важливий момент</p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        {selectedEntity && (
          <div className="modal-form-group">
            <p className="modal-label" style={{ marginBottom: "12px" }}>
              Спогад для:{" "}
              <span style={{ color: "var(--accent-strong)" }}>
                {getEntityName()}
              </span>
            </p>

            {selectedEntity.data.categories?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "16px",
                }}
              >
                {selectedEntity.data.categories.map((cat, index) => (
                  <span
                    key={index}
                    className="places-count"
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 10px",
                      opacity: 0.8,
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-form-group">
          <label className="modal-label">Назва спогаду</label>
          <input
            type="text"
            name="title"
            className="modal-input"
            required
            placeholder="Що сталось?"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="modal-form-group">
            <label className="modal-label">Дата</label>
            <input type="date" name="date" className="modal-input" required />
          </div>
          <div className="modal-form-group">
            <label className="modal-label">Місце</label>
            <input
              type="text"
              name="place"
              className="modal-input"
              required
              placeholder="Де були?"
            />
          </div>
        </div>

        <div className="modal-form-group">
          <label className="modal-label">Категорія</label>
          <input
            type="text"
            name="category"
            className="modal-input"
            placeholder="Виберіть або введіть нову"
            list="existing-categories"
          />
          <datalist id="existing-categories">
            {selectedEntity?.data.categories?.map((cat, index) => (
              <option key={index} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="modal-form-group">
          <label className="modal-label">Опис</label>
          <textarea
            name="description"
            className="modal-input"
            rows="3"
            placeholder="Розкажіть детальніше..."
            style={{ resize: "none" }}
            required
          ></textarea>
        </div>

        <div className="modal-form-group">
          <label className="modal-label">Світлини</label>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="modal-input"
            style={{ fontSize: "0.8rem", padding: "8px" }}
          />

          {selectedFiles.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    aspectRatio: "1/1",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    alt="preview"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      background: "rgba(0,0,0,0.5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="modal-btn modal-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Збереження..." : "Створити"}
          </button>
        </div>
      </form>
    </div>
  );
}
