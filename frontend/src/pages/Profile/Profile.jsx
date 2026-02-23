import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(null);

  if (!user) {
    return <div className="text-center mt-5">Завантаження...</div>;
  }

  return (
    <>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-4 col-lg-3">
            <div className="card shadow-sm text-center p-3">

              <img
                src={user.avatar ? `http://localhost:5000${user.avatar}` : '/default-avatar.png'}
                alt="Profile"
                className="rounded-circle mx-auto mb-3"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />

              <h4 className="mb-0">{user.fullName || user.username}</h4>
              <div className="text-muted">@{user.username}</div>
              <div className="small text-muted mb-3">{user.email}</div>

              <div className="d-flex justify-content-around my-3">
                <div>
                  <div className="fw-bold">0</div>
                  <small className="text-muted">Друзів</small>
                </div>
                <div>
                  <div className="fw-bold">0</div>
                  <small className="text-muted">Груп</small>
                </div>
                <div>
                  <div className="fw-bold">0</div>
                  <small className="text-muted">Спогадів</small>
                </div>
              </div>

              <button className="btn btn-outline-danger w-100" onClick={logout}>
                Вийти
              </button>
            </div>
          </div>
          <div className="col-md-8 col-lg-9 mt-4 mt-md-0">
            <div className="card shadow-sm p-4">
              <h5>Мій календар</h5>
              <p className="text-muted">Календар тимчасово вимкнений</p>
            </div>

            <div className="card shadow-sm p-4 mt-3">
              <h5>Нещодавні спогади</h5>
              <p className="text-muted">Спогади поки що відсутні</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}