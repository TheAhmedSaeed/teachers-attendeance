import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Home, Users, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await logout();
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            <span className="brand-icon">📋</span>
            <span>نظام الحضور</span>
          </Link>
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Home size={18} />
              <span>الرئيسية</span>
            </Link>
            <Link
              to="/config"
              className={`nav-link ${location.pathname === '/config' ? 'active' : ''}`}
            >
              <Settings size={18} />
              <span>الإعدادات</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>المستخدمون</span>
              </Link>
            )}
          </div>
          <div className="user-section">
            <div className="user-info">
              <User size={16} />
              <span>{user?.name || 'مستخدم'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="تسجيل الخروج">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
