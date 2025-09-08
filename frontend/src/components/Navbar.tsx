import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      onLogout();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <img
            src="http://localhost:5000/static/image/logo.png"
            alt="民派新语"
            className="logo-img"
          />
        </div>

        {/* 导航链接 */}
        <div className="navbar-links">
          <Link to="/home" className="nav-link">文化概览</Link>
          <Link to="/ai-dialogue" className="nav-link">AI对话</Link>
          <Link to="/audio-book" className="nav-link">有声读物</Link>
          <Link to="/home" className="nav-link">线上桌游</Link>
          <Link to="/home" className="nav-link">互动答题</Link>
          <Link to="/home" className="nav-link">个人中心</Link>
        </div>

        {/* 登出按钮 */}
        <div className="navbar-actions">
          <button onClick={handleLogout} className="logout-btn">
            退出登录
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
