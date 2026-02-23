import { useState } from "react";

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

    const newCategory = {
      id: Date.now(),
      name: newCategoryName.trim(),
    };

    onAddCategory(newCategory);
    setNewCategoryName("");
    setIsAdding(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewCategoryName("");
    }
  }

  return (
    <div
      className="p-3"
      style={{
        width: "220px",
        background: "#F8F7FF",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(89, 46, 131, 0.12)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5
          className="mb-0"
          style={{ fontWeight: 600, color: "var(--text-primary)" }}
        >
          Категорії
        </h5>
        <button
          className="btn"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--accent-strong)",
            color: "#fff",
            fontWeight: "bold",
            lineHeight: 1,
            padding: 0,
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setIsAdding(true)}
        >
          +
        </button>
      </div>

      {isAdding && (
        <div className="mb-3">
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Нова категорія"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{
              borderRadius: "10px",
              border: "1px solid var(--border, #E9DDF8)",
              color: "var(--text-primary, #2D1B3D)",
              padding: "10px 12px",
            }}
          />
          <div className="d-flex gap-2">
            <button
              className="btn"
              style={{
                flex: 1,
                background: "var(--accent-strong)",
                color: "var(--text-primary)",
                borderRadius: "10px",
                border: "none",
                fontWeight: 600,
              }}
              onClick={handleAdd}
            >
              ✓
            </button>
            <button
              className="btn"
              style={{
                flex: 1,
                background: "var(--border, #E9DDF8)",
                color: "var(--text-muted, #6E5A85)",
                borderRadius: "10px",
                border: "none",
                fontWeight: 600,
              }}
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName("");
              }}
            >
              ✗
            </button>
          </div>
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        {categories.map((cat) => {
          const isActive = selectedCategory?.id === cat.id;
          return (
            <button
              key={cat.id}
              className="btn text-start"
              style={{
                background: isActive ? "var(--accent-strong)" : "#EFEAFE",
                color: isActive ?  "#EFEAFE" : "var(--accent-strong)" ,
                borderRadius: "20px",
                border: "none",
                padding: "6px 12px",
                textAlign: "left",
                transition: "all 0.2s ease",
                cursor: "pointer",
                fontWeight: 500,
              }}
              onClick={() => onSelectCategory(cat)}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
