import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, ImagePlus } from "lucide-react";
import "./auth.css";

export default function Register() {
  const { register, user, error: authError, setError: setAuthError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarName, setAvatarName] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    avatar: null,
  });

  useEffect(() => { setError(""); setAuthError(null); }, []);
  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  function handleChange(e) {
    if (e.target.type === "file") {
      const file = e.target.files[0];
      setFormData({ ...formData, avatar: file });
      setAvatarName(file ? file.name : "");
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
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

  const fields = [
    { name: "username", label: "Нікнейм", placeholder: "your_username" },
    { name: "fullName", label: "Повне ім'я", placeholder: "Іван Іваненко" },
    { name: "email", label: "Email", placeholder: "example@mail.com", type: "email" },
    { name: "password", label: "Пароль", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Friends Calendar</h1>
          <p>Створіть свій акаунт</p>
        </div>

        {(error || authError) && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error || authError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {fields.map(({ name, label, placeholder, type = "text" }) => (
            <div className="auth-field" key={name}>
              <label className="auth-label">{label}</label>
              <input
                name={name}
                type={type}
                className="auth-input"
                placeholder={placeholder}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="auth-field">
            <label className="auth-label">Аватар (необов'язково)</label>
            <label className="auth-file-label" htmlFor="avatar-upload">
              <ImagePlus size={16} />
              <span>{avatarName || "Вибрати фото..."}</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              className="auth-file-input"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Реєстрація..." : "Зареєструватися"}
          </button>
        </form>

        <p className="auth-footer">
          Вже маєте акаунт?
          <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
