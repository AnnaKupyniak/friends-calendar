import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, user, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Очищаємо помилку при завантаженні сторінки
  useEffect(() => {
    setError(null);
  }, []);

  // Переходимо на домашню сторінку якщо користувач увійшов
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Очищаємо помилку при заповненні форми
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
    } catch (err) {
      // Помилка вже встановлена в AuthContext
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div
        className="card border-0 p-4"
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "20px",
          background: "var(--surface)",
          boxShadow: "0 10px 30px rgba(89, 46, 131, 0.15)",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 600,
          }}
        >
          Вхід
        </h3>

        {error && (
          <div
            className="alert alert-danger d-flex align-items-center mb-3"
            role="alert"
            style={{
              borderRadius: "10px",
              border: "1px solid #f5365c",
              background: "rgba(245, 54, 92, 0.1)",
              color: "#f5365c",
              padding: "12px 14px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginRight: "10px", flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ color: "var(--text-primary)" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              className="form-control"
              onChange={handleChange}
              required
              style={{
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                padding: "10px 12px",
              }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ color: "var(--text-primary)" }}>
              Пароль
            </label>
            <input
              name="password"
              type="password"
              className="form-control"
              onChange={handleChange}
              required
              style={{
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                padding: "10px 12px",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #FEB702, #F5811F)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "12px",
              padding: "10px",
              border: "none",
              boxShadow: "0 6px 18px rgba(245, 129, 31, 0.35)",
              transition: "0.2s ease",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}