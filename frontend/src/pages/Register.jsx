import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { register, user, error: authError, setError: setAuthError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    avatar: null,
  });

  // Очищаємо помилки при завантаженні сторінки
  useEffect(() => {
    setError("");
    setAuthError(null);
  }, []);

  // Переходимо на домашню сторінку якщо користувач був зареєстрований
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  function handleChange(e) {
    if (e.target.type === "file") {
      setFormData({ ...formData, avatar: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    // Очищаємо помилку при заповненні форми
    if (error) setError("");
    if (authError) setAuthError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setAuthError(null);
    setLoading(true);

    const data = new FormData();
    data.append("username", formData.username);
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("password", formData.password);
    if (formData.avatar) data.append("avatar", formData.avatar);

    try {
      await register(data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Помилка реєстрації. Можливо, такий email вже зайнятий.";
      setError(message);
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
          maxWidth: "450px",
          borderRadius: "22px",
          background: "var(--surface)",
          boxShadow: "0 14px 36px rgba(89, 46, 131, 0.15)",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-strong))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 600,
          }}
        >
          Реєстрація
        </h3>
        {(error || authError) && (
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
            <span>{error || authError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {["username", "fullName", "email", "password"].map((field, idx) => (
            <div className="mb-3" key={idx}>
              <label
                className="form-label"
                style={{ color: "var(--text-primary)" }}
              >
                {field === "fullName"
                  ? "Прізвище та ім'я"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>

              <input
                name={field}
                type={
                  field === "email"
                    ? "email"
                    : field === "password"
                      ? "password"
                      : "text"
                }
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
          ))}

          <div className="mb-4">
            <label
              className="form-label"
              style={{ color: "var(--text-primary)" }}
            >
              Аватар
            </label>

            <input
              type="file"
              className="form-control"
              onChange={handleChange}
              style={{
                borderRadius: "10px",
                border: "1px dashed var(--accent-soft)",
                background: "var(--bg)",
                padding: "8px 12px",
                cursor: "pointer",
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
              borderRadius: "14px",
              padding: "11px",
              border: "none",
              boxShadow: "0 8px 20px rgba(245, 129, 31, 0.35)",
              transition: "0.2s ease",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "Завантаження..." : "Зареєструватися"}
          </button>
        </form>
      </div>
    </div>
  );
}
