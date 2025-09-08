import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/PDFReader.css';

interface PDFReaderProps {}

const PDFReader: React.FC<PDFReaderProps> = () => {
  const { imageIndex } = useParams<{ imageIndex: string }>();
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageRange, setPageRange] = useState({ start: 1, end: 8 });
  const [isAnimating, setIsAnimating] = useState(false);

  // 根据imageIndex设置页数范围
  useEffect(() => {
    const index = parseInt(imageIndex || '1');
    let startPage = 1;
    let endPage = 8;

    switch (index) {
      case 1:
        startPage = 1;
        endPage = 8;
        break;
      case 2:
        startPage = 9;
        endPage = 15;
        break;
      case 3:
        startPage = 16;
        endPage = 23;
        break;
      case 4:
        startPage = 24;
        endPage = 28;
        break;
      case 5:
        startPage = 29;
        endPage = 32;
        break;
      case 6:
        startPage = 33;
        endPage = 36;
        break;
      default:
        startPage = 1;
        endPage = 8;
    }

    setPageRange({ start: startPage, end: endPage });
    setPageNumber(startPage);
  }, [imageIndex]);

  const handlePrevPage = () => {
    if (pageNumber > pageRange.start && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setPageNumber(prev => prev - 2);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < pageRange.end - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setPageNumber(prev => prev + 2);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleBack = () => {
    navigate('/audio-book');
  };

  return (
    <div className="pdf-reader-container">
      {/* 背景图片 */}
      <div className="pdf-reader-background">
        <img
          src="http://localhost:5000/static/image/index.png"
          alt="PDF阅读器背景"
          className="background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="pdf-reader-content">
        {/* 返回按钮 */}
        <button className="back-btn" onClick={handleBack}>
          ← 返回有声读物
        </button>

        {/* PDF显示区域 */}
        <div className="pdf-display">
          <div className={`pdf-pages ${isAnimating ? 'animating' : ''}`}>
            {/* 左侧页面 */}
            <div className="pdf-page left-page">
              <div className="page-content">
                <div className="page-placeholder">
                  <p>第 {pageNumber} 页</p>
                  <small>PDF内容将在此处显示</small>
                  <div className="pdf-iframe-container">
                    <iframe
                      src={`http://localhost:5000/static/text.pdf#page=${pageNumber}`}
                      className="pdf-iframe"
                      title={`第${pageNumber}页`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧页面 */}
            <div className="pdf-page right-page">
              <div className="page-content">
                <div className="page-placeholder">
                  <p>第 {pageNumber + 1} 页</p>
                  <small>PDF内容将在此处显示</small>
                  <div className="pdf-iframe-container">
                    <iframe
                      src={`http://localhost:5000/static/text.pdf#page=${pageNumber + 1}`}
                      className="pdf-iframe"
                      title={`第${pageNumber + 1}页`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="pdf-controls">
          <button
            className="control-btn prev-btn"
            onClick={handlePrevPage}
            disabled={pageNumber <= pageRange.start || isAnimating}
          >
            ◀ 上一页
          </button>

          <div className="page-info">
            <span>第 {pageNumber}-{Math.min(pageNumber + 1, pageRange.end)} 页</span>
            <br />
            <small>总范围: {pageRange.start}-{pageRange.end} 页</small>
          </div>

          <button
            className="control-btn next-btn"
            onClick={handleNextPage}
            disabled={pageNumber >= pageRange.end - 1 || isAnimating}
          >
            下一页 ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFReader;
