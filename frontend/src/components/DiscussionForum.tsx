import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/DiscussionForum.css';

interface Discussion {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
}

const DiscussionForum: React.FC = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');

  // 获取当前用户信息
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/check_auth');
      if (response.data.authenticated) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }, []);

  // 获取讨论列表
  const fetchDiscussions = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`/api/discussions?page=${pageNum}&per_page=20`);
      setDiscussions(response.data.discussions);
      setTotalPages(response.data.pagination.pages);
      setTotalCount(response.data.pagination.total);
      setPage(pageNum);
    } catch (error: any) {
      console.error('获取讨论列表失败:', error);
      setError('获取讨论列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchDiscussions();
  }, [fetchCurrentUser, fetchDiscussions]);

  // 发表新讨论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('请先登录后再发表观点');
      return;
    }

    if (!newContent.trim()) {
      setError('请输入观点内容');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post('/api/discussions', {
        content: newContent.trim()
      });

      setDiscussions([response.data.discussion, ...discussions]);
      setTotalCount(totalCount + 1);
      setNewContent('');
      setError('');
    } catch (error: any) {
      console.error('发表观点失败:', error);
      setError(error.response?.data?.error || '发表观点失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除讨论
  const handleDelete = async (id: number) => {
    if (!currentUser) return;

    if (!window.confirm('确定要删除这条观点吗？')) {
      return;
    }

    try {
      await axios.delete(`/api/discussions/${id}`);
      setDiscussions(discussions.filter(d => d.id !== id));
      setTotalCount(totalCount - 1);
    } catch (error: any) {
      console.error('删除观点失败:', error);
      setError(error.response?.data?.error || '删除观点失败，请稍后重试');
    }
  };

  // 开始编辑
  const startEdit = (discussion: Discussion) => {
    setEditingId(discussion.id);
    setEditContent(discussion.content);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 提交编辑
  const submitEdit = async (id: number) => {
    if (!editContent.trim()) {
      setError('请输入观点内容');
      return;
    }

    try {
      const response = await axios.put(`/api/discussions/${id}`, {
        content: editContent.trim()
      });

      setDiscussions(discussions.map(d =>
        d.id === id ? response.data.discussion : d
      ));
      cancelEdit();
    } catch (error: any) {
      console.error('修改观点失败:', error);
      setError(error.response?.data?.error || '修改观点失败，请稍后重试');
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div className="discussion-forum">
      {/* 背景图片 */}
      <div className="forum-background">
        <div className="background-overlay"></div>
      </div>

      {/* 主要内容 */}
      <div className="forum-container">
        {/* 标题区域 */}
        <div className="forum-header">
          <h1>观点交流</h1>
          <p>分享您对闽派文化的见解和感悟</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="error-close">×</button>
          </div>
        )}

        {/* 发表观点表单 */}
        {currentUser ? (
          <div className="discussion-form">
            <h3>发表观点</h3>
            <form onSubmit={handleSubmit}>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="请分享您的观点..."
                maxLength={1000}
                rows={4}
                disabled={submitting}
              />
              <div className="form-footer">
                <span className="char-count">{newContent.length}/1000</span>
                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="submit-btn"
                >
                  {submitting ? '发表中...' : '发表观点'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="login-prompt">
            <p>请先登录后再参与观点交流</p>
          </div>
        )}

        {/* 讨论列表 */}
        <div className="discussions-list">
          <h3>观点交流 ({totalCount})</h3>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : discussions.length === 0 ? (
            <div className="empty-state">
              <p>还没有观点发表，快来分享您的见解吧！</p>
            </div>
          ) : (
            <>
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className={`discussion-item ${
                    currentUser && discussion.user_id === currentUser.id ? 'own-message' : 'other-message'
                  }`}
                >
                  <div className="discussion-header">
                    <span className="username">{discussion.username}</span>
                    <span className="time">{formatTime(discussion.created_at)}</span>
                  </div>

                  {editingId === discussion.id ? (
                    <div className="edit-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={1000}
                        rows={3}
                      />
                      <div className="edit-actions">
                        <button
                          onClick={() => submitEdit(discussion.id)}
                          className="save-btn"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="cancel-btn"
                        >
                          取消
                        </button>
                        <span className="char-count">{editContent.length}/1000</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="discussion-content">
                        {discussion.content}
                      </div>
                      {currentUser && discussion.user_id === currentUser.id && (
                        <div className="discussion-actions">
                          <button
                            onClick={() => startEdit(discussion)}
                            className="edit-btn"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(discussion.id)}
                            className="delete-btn"
                          >
                            删除
                          </button>
                        </div>
                      )}
                      {discussion.updated_at !== discussion.created_at && (
                        <div className="edited-indicator">
                          已编辑
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchDiscussions(page - 1)}
                    disabled={page <= 1}
                    className="page-btn"
                  >
                    上一页
                  </button>
                  <span className="page-info">
                    第 {page} 页，共 {totalPages} 页
                  </span>
                  <button
                    onClick={() => fetchDiscussions(page + 1)}
                    disabled={page >= totalPages}
                    className="page-btn"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionForum;