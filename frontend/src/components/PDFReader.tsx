import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import '../styles/PDFReader.css';

// 配置PDF.js worker - 使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

interface PDFReaderProps {}

interface PDFPageProps {
  pageNumber: number;
  pdfUrl: string;
}

const PDFPage: React.FC<PDFPageProps> = ({ pageNumber, pdfUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        // 获取指定页面
        const page = await pdf.getPage(pageNumber);

        // 获取canvas上下文
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // 计算缩放比例以适应容器
        const containerWidth = canvas.parentElement?.clientWidth || 400;
        const containerHeight = canvas.parentElement?.clientHeight || 600;

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        // 设置canvas尺寸
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // 渲染页面
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
        setLoading(false);

      } catch (err) {
        console.error('PDF渲染错误:', err);
        setError('页面加载失败');
        setLoading(false);
      }
    };

    renderPage();
  }, [pageNumber, pdfUrl]);

  if (error) {
    return (
      <div className="pdf-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-page-container">
      {loading && (
        <div className="pdf-loading">
          <p>加载中...</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="pdf-canvas"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

const PDFReader: React.FC<PDFReaderProps> = () => {
  const { imageIndex } = useParams<{ imageIndex: string }>();
  const navigate = useNavigate();
  const [currentPageSet, setCurrentPageSet] = useState<number>(0);
  const [pageRange, setPageRange] = useState({ start: 1, end: 8 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

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
    setCurrentPageSet(0); // 重置到第一组页面
  }, [imageIndex]);

  // 计算当前显示的页面
  const getCurrentPages = () => {
    const leftPage = pageRange.start + (currentPageSet * 2);
    const rightPage = leftPage + 1;
    return { leftPage, rightPage };
  };

  const { leftPage, rightPage } = getCurrentPages();

  // 计算总的页面组数
  const totalPageSets = Math.ceil((pageRange.end - pageRange.start + 1) / 2);

  const handlePrevPage = () => {
    if (currentPageSet > 0 && !isAnimating) {
      setAnimationDirection('right'); // 向右翻页动画
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPageSet(prev => prev - 1);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 600);
    }
  };

  const handleNextPage = () => {
    if (currentPageSet < totalPageSets - 1 && !isAnimating) {
      setAnimationDirection('left'); // 向左翻页动画
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPageSet(prev => prev + 1);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 600);
    }
  };

  const handleBack = () => {
    navigate('/audio-book');
  };

  // 判断是否需要显示空白页面
  const shouldShowBlankPage = () => {
    return rightPage > pageRange.end;
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
          <div className={`pdf-pages ${isAnimating ? 'animating' : ''} ${animationDirection ? `flip-${animationDirection}` : ''}`}>
            {/* 左侧页面 */}
            <div className="pdf-page left-page">
              <PDFPage
                pageNumber={leftPage}
                pdfUrl="http://localhost:5000/static/text.pdf"
              />
            </div>

            {/* 右侧页面 */}
            <div className="pdf-page right-page">
              {!shouldShowBlankPage() ? (
                <PDFPage
                  pageNumber={rightPage}
                  pdfUrl="http://localhost:5000/static/text.pdf"
                />
              ) : (
                <div className="blank-page">
                  <div className="blank-content">
                    <span>空白页</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="pdf-controls">
          <button
            className="control-btn prev-btn"
            onClick={handlePrevPage}
            disabled={currentPageSet <= 0 || isAnimating}
          >
            ◀ 上一页
          </button>

          <div className="page-info">
            <span>第 {leftPage}{!shouldShowBlankPage() ? `-${rightPage}` : ''} 页</span>
            <br />
            <small>第 {currentPageSet + 1} / {totalPageSets} 组 · 总范围: {pageRange.start}-{pageRange.end} 页</small>
          </div>

          <button
            className="control-btn next-btn"
            onClick={handleNextPage}
            disabled={currentPageSet >= totalPageSets - 1 || isAnimating}
          >
            下一页 ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFReader;
