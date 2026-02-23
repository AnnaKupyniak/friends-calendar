import { useContext, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";

export default function CreateMemory({ onClose }) {
  const { selectedEntity, addCategoryToFriendship, addCategoryToGroup } =
    useContext(FriendsContext);
  const { createMemory } = useContext(MemoriesContext);
  const [selectedFile, setSelectedFile] = useState(null);
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
      console.log(`Category "${categoryName}" doesn't exist. Adding...`);

      try {
        if (selectedEntity.type === "friend") {
          await addCategoryToFriendship(selectedEntity.data._id, categoryName);
        } else if (selectedEntity.type === "group") {
          await addCategoryToGroup(selectedEntity.data._id, categoryName);
        }
        console.log(`Category "${categoryName}" added successfully`);
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

    if (selectedFile) {
      formData.append("photo", selectedFile);
    }

    console.log("=== FormData contents ===");
    for (let pair of formData.entries()) {
      console.log(
        pair[0] + ": " + (pair[0] === "photo" ? pair[1].name : pair[1]),
      );
    }

    try {
      const result = await createMemory(formData);
      console.log("Memory created:", result);

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
    const file = event.target.files[0];
    setSelectedFile(file);
  }

  return (
    <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
      <h4 className="mb-3">Створити спогад</h4>

      {selectedEntity && (
        <div className="mb-3">
          <div className="fw-bold">Спогад для: {getEntityName()}</div>

          {selectedEntity.data.categories?.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">Існуючі категорії:</small>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {selectedEntity.data.categories.map((cat, index) => (
                  <span key={index} className="badge bg-secondary">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Назва спогаду</label>
        <input type="text" name="title" className="form-control" required />
      </div>

      <div className="mb-3">
        <label className="form-label">Дата</label>
        <input type="date" name="date" className="form-control" required />
      </div>

      <div className="mb-3">
        <label className="form-label">Місце</label>
        <input type="text" name="place" className="form-control" required />
      </div>

      <div className="mb-3">
        <label className="form-label">Категорія</label>
        <input
          type="text"
          name="category"
          className="form-control"
          placeholder="Введіть категорію"
          list="existing-categories"
        />
        <datalist id="existing-categories">
          {selectedEntity?.data.categories?.map((cat, index) => (
            <option key={index} value={cat} />
          ))}
        </datalist>
        <div className="form-text">
          Якщо такої категорії немає, вона буде автоматично додана
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Опис спогаду</label>
        <textarea
          name="description"
          rows="4"
          className="form-control"
          required
        ></textarea>
      </div>

      <div className="mb-3">
        <label className="form-label">Фото</label>
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="form-control"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <div className="form-text">Вибрано: {selectedFile.name}</div>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Скасувати
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Збереження..." : "Зберегти спогад"}
        </button>
      </div>
    </form>
  );
}
