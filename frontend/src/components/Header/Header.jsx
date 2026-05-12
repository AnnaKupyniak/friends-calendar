import { useContext, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./header.css";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          Friends Calendar
        </Link>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${isMenuOpen ? 'mobile-active' : ''}`}>
          {user ? (
            <>
              <NavLink to="/" className="nav-link" onClick={closeMenu}>
                Головна
              </NavLink>
              <NavLink to="/myCalendar" className="nav-link" onClick={closeMenu}>
                Мій календар
              </NavLink>
              <NavLink to="/profile" className="nav-link" onClick={closeMenu}>
                Профіль
              </NavLink>
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                Увійти
              </NavLink>
              <button
                className="primary-btn"
                onClick={() => {
                  navigate("/register");
                  closeMenu();
                }}
              >
                Реєстрація
              </button>
            </>
          )}
        </nav>

        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </div>
    </header>
  );
}