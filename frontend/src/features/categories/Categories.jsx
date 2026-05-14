import { useState } from "react";
import { Folder } from "lucide-react";
import "./Categories.css";

export default function Categories({
  categories = [],
  onSelectCategory,
  onAddCategory,
  selectedCategory,
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    if (!newCategoryName.trim()) return;
    onAddCategory({ id: Date.now(), name: newCategoryName.trim() });
    setNewCategoryName("");
    setIsAdding(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setIsAdding(false); setNewCategoryName(""); }
  }

  return (
    <div className="categories-panel">
      <div className="categories-header">
        <h2 className="categories-title">Категорії</h2>
        <button
          className="categories-add-btn"
          onClick={() => setIsAdding(true)}
          title="Додати категорію"
        >
          +
        </button>
      </div>

      {isAdding && (
        <div className="categories-form">
          <input
            type="text"
            className="categories-input"
            placeholder="Нова категорія"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
          <div className="categories-form-actions">
            <button className="cat-confirm-btn" onClick={handleAdd}>Додати</button>
            <button className="cat-cancel-btn" onClick={() => { setIsAdding(false); setNewCategoryName(""); }}>Скасувати</button>
          </div>
        </div>
      )}

      <div className="categories-list">
        {categories.map((cat) => {
          const isActive = selectedCategory?.id === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-btn${isActive ? " active" : ""}`}
              onClick={() => onSelectCategory(cat)}
            >
              <Folder size={14} className="cat-icon" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
