import React, { useEffect, useState, useContext } from "react";
import { MemoriesContext } from "../../context/MemoriesContext";
import "../../styles/memoriesSearch.css";

export function MemoriesSearch() {
  const {
    searchMemories,
    getAllTags,
    clearSearch
  } = useContext(MemoriesContext);

  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [place, setPlace] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const res = await getAllTags();
      setAllTags(res.data || res); // 🔥 захист від різних форматів
    } catch (error) {
      console.error('Error loading tags:', error);
      setError('Не вдалось завантажити теги');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...(query && { query }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(place && { place }),
        sortBy
      };

      const data = await searchMemories(searchParams);

      if (!data || data.length === 0) {
        setError('Спогадів не знайдено');
      }

    } catch (err) {
      console.error('Error searching:', err);
      setError('Помилка при пошуку');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTags([]);
    setStartDate('');
    setEndDate('');
    setPlace('');
    setSortBy('date');
    setError('');
    clearSearch();
  };

  return (
    <div className="inline-search-container">
      <div className="inline-search-main">
        <div className="inline-search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="inline-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Знайти спогад..."
          />
        </div>
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} 
          onClick={() => setShowFilters(!showFilters)} 
          title="Фільтри"
        >
          {showFilters ? '✕' : '⚙️'}
        </button>
      </div>

      {showFilters && (
        <div className="inline-filters-dropdown">
          <div className="filters-grid">
            <div className="filter-item">
              <label>Від</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>До</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Місце</label>
              <input
                placeholder="Введіть локацію"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Сортування</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Дата (замовчування)</option>
                <option value="newest">Найновіші-Події</option>
                <option value="oldest">Найстаріші-Події</option>
                <option value="title">За назвою</option>
              </select>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="filter-tags-section">
              <label>Теги</label>
              <div className="tags-list">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>Очистити</button>
            <button className="apply-filters-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Шукаємо...' : 'Застосувати'}
            </button>
          </div>
          
          {error && <p className="search-error-msg">{error}</p>}
        </div>
      )}
    </div>
  );
}