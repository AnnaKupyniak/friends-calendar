import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "./auth.css";

export default function Login() {
  const { login, user, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => { setError(null); }, []);
  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Календар друзів</h1>
          <p>Вхід до вашого акаунту</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Електронна пошта</label>
            <input
              name="email"
              type="email"
              className="auth-input"
              placeholder="name@example.com"
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Пароль</label>
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        <p className="auth-footer">
          Ще не зареєстровані?
          <Link to="/register">Створити акаунт</Link>
        </p>
      </div>
    </div>
  );
}