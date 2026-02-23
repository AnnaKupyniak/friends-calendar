import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await login(formData);
    navigate("/");
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
            style={{
              background: "linear-gradient(135deg, #FEB702, #F5811F)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "12px",
              padding: "10px",
              border: "none",
              boxShadow: "0 6px 18px rgba(245, 129, 31, 0.35)",
              transition: "0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Увійти
          </button>
        </form>
      </div>
    </div>
  );
}