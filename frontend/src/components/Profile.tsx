import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // 处理修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新密码和确认密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('新密码长度至少6位');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/user/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });

      alert('密码修改成功！');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      alert(error.response?.data?.error || '密码修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注销账号
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user.username) {
      alert('请输入正确的用户名进行确认');
      return;
    }

    if (!window.confirm('⚠️ 警告：此操作不可逆！\n\n您的个人数据将被永久删除，但匿名统计数据将被保留。\n\n确定要继续吗？')) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.delete('/api/user/delete-account');
      alert('账号已成功注销');
      onLogout();
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.error || '注销账号失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      onLogout();
      navigate('/');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-container">
      {/* 背景图片 */}
      <div className="profile-background">
        <img
          src="/static/image/index.png"
          alt="背景图片"
          className="profile-background-img"
        />
      </div>

      {/* 主要内容 */}
      <div className="profile-content">
        {/* 页面标题 */}
        <div className="profile-header">
          <h1>个人中心</h1>
          <p>管理您的账户信息和设置</p>
        </div>

        {/* 内容网格 */}
        <div className="profile-grid">
          {/* 用户信息卡片 */}
          <div className="profile-card user-info-card">
            <div className="card-header">
              <h2>用户信息</h2>
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>用户名</label>
                <span>{user.username}</span>
              </div>
              <div className="info-item">
                <label>邮箱</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>注册时间</label>
                <span>{formatDate(user.created_at)}</span>
              </div>
              <div className="info-item">
                <label>账户状态</label>
                <span className="status-active">正常</span>
              </div>
            </div>
          </div>

          {/* 账户管理卡片 */}
          <div className="profile-card account-card">
            <div className="card-header">
              <h2>账户管理</h2>
            </div>
            <div className="card-content">
              <div className="action-buttons">
                <button
                  className="action-btn primary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔒 修改密码
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleLogout}
                >
                  🚪 退出登录
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ 注销账号
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>修改密码</h3>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>当前密码</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? '修改中...' : '确认修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 注销账号模态框 */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>⚠️ 注销账号</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">🚨</div>
              <p className="warning-text">
                <strong>重要提醒：</strong>
              </p>
              <ul className="warning-list">
                <li>此操作不可逆，账号将被永久删除</li>
                <li>您的个人数据将被完全清除</li>
                <li>匿名统计数据将被保留用于改进服务</li>
                <li>删除后无法恢复任何数据</li>
              </ul>
              <div className="confirmation-input">
                <label>请输入您的用户名 <strong>{user.username}</strong> 进行确认：</label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="输入用户名进行确认"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmation !== user.username}
              >
                {isLoading ? '注销中...' : '确认注销'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
