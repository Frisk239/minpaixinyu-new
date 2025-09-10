import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import '../styles/WordReader.css';

interface WordReaderProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const WordReader: React.FC<WordReaderProps> = ({ fileUrl, fileName, isOpen, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileUrl) {
      loadDocument();
    }
  }, [isOpen, fileUrl]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('开始加载Word文档:', fileUrl);

      // 获取Word文档
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // 使用mammoth.js转换Word文档为HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });

      console.log('Word文档转换完成');

      // 处理转换结果
      if (result.messages.length > 0) {
        console.warn('转换警告:', result.messages);
      }

      setContent(result.value);
    } catch (err) {
      console.error('加载Word文档失败:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`文档加载失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="word-reader-overlay" onClick={onClose}>
      <div className="word-reader-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="word-reader-header">
          <div className="word-reader-actions">
            <button
              className="word-reader-download-btn"
              onClick={handleDownload}
              title="下载文档"
            >
              📥 下载
            </button>
            <button
              className="word-reader-close-btn"
              onClick={onClose}
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="word-reader-content">
          {loading && (
            <div className="word-reader-loading">
              <div className="loading-spinner"></div>
              <p>正在加载文档内容...</p>
            </div>
          )}

          {error && (
            <div className="word-reader-error">
              <p>{error}</p>
              <button onClick={loadDocument} className="retry-btn">
                重试
              </button>
            </div>
          )}

          {!loading && !error && content && (
            <div
              className="word-document-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WordReader;
