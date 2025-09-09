import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Register.css';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface RegisterProps {
  onLogin: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码一致性
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      onLogin(response.data.user);
      navigate('/home');
    } catch (error: any) {
      if (error.response) {
        setError(error.response.data.error || '注册失败');
      } else {
        setError('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 上方图片 */}
      <div className="login-top-image">
        <img
          src="http://localhost:5000/static/image/login1.png"
          alt="注册页面顶部"
          className="login1-img"
        />
      </div>

      {/* 装饰性导航栏 - 完全照搬home页面 */}
      <nav className="login-navbar">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo">
            <img
              src="http://localhost:5000/static/image/logo.png"
              alt="闽派新语"
              className="navbar-logo-img"
            />
          </div>

          {/* 导航链接 */}
          <div className="navbar-menu">
            <span className="navbar-item">文化云游</span>
            <span className="navbar-item">AI对话</span>
            <span className="navbar-item">有声读物</span>
            <span className="navbar-item">线上桌游</span>
            <span className="navbar-item">互动答题</span>
            <span className="navbar-item">个人中心</span>
          </div>

          {/* 右侧占位 */}
          <div className="navbar-actions">
            <div style={{ width: '80px' }}></div>
          </div>
        </div>
      </nav>

      {/* 下方内容区域 */}
      <div className="login-bottom-section">
        {/* 左侧图片 */}
        <div className="login-left-image">
          <img
            src="http://localhost:5000/static/image/login2.png"
            alt="注册页面左侧"
            className="login2-img"
          />
        </div>

        {/* 右侧表单 */}
        <div className="login-form-section">
          <div className="form-container">
            <h2>用户注册</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">用户名</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="请输入用户名"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">邮箱</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">密码</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="请输入密码（至少6位）"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">确认密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="请再次输入密码"
                />
              </div>
              <div className="form-group">
                <button type="submit" disabled={loading}>
                  {loading ? '注册中...' : '注册'}
                </button>
              </div>
            </form>
            <div className="register-link">
              <p>已有账号？<Link to="/login">立即登录</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
