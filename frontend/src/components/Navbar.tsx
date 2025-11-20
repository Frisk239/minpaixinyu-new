import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <img
            src="/static/image/logo.png"
            alt="民派新语"
            className="logo-img"
          />
        </div>

        {/* 汉堡菜单按钮 - 只在移动端显示 */}
        <button
          className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="切换菜单"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* 导航链接 */}
        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/home" className="nav-link" onClick={closeMenu}>文化云游</Link>
          <Link to="/ai-dialogue" className="nav-link" onClick={closeMenu}>AI对话</Link>
          <Link to="/audio-book" className="nav-link" onClick={closeMenu}>有声读物</Link>
          <Link to="/data-compilation" className="nav-link" onClick={closeMenu}>资料汇编</Link>
          <Link to="/card-game" className="nav-link" onClick={closeMenu}>线上桌游</Link>
          <Link to="/quiz" className="nav-link" onClick={closeMenu}>互动答题</Link>
          <Link to="/profile" className="nav-link" onClick={closeMenu}>个人中心</Link>
        </div>
      </div>

      {/* 移动端菜单遮罩 */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </nav>
  );
};

export default Navbar;
