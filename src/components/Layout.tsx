import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Home } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
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
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
