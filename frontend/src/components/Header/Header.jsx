import { useContext } from "react";
import { NavLink, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./header.css";

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="logo">
          Friends Calendar
        </Link>

        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/" className="nav-link">
                Головна
              </NavLink>
              <NavLink to="/myCalendar" className="nav-link">
                Мій календар
              </NavLink>
              <NavLink to="/profile" className="nav-link">
                Профіль
              </NavLink>
              <button onClick={logout} className="logout-btn">
                Вийти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link accent">
                Login
              </NavLink>
              <Link to="/register" className="primary-btn">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}