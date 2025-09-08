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
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[PDFPage] 开始渲染页面 ${pageNumber}, URL: ${pdfUrl}`);

    const renderPage = async () => {
      try {
        console.log(`[PDFPage] 开始加载PDF文档，页面 ${pageNumber}`);
        setLoading(true);
        setError(null);

        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        console.log(`[PDFPage] PDF加载任务创建完成，页面 ${pageNumber}`);

        const pdf = await loadingTask.promise;
        console.log(`[PDFPage] PDF文档加载完成，总页数: ${pdf.numPages}, 请求页面: ${pageNumber}`);

        // 检查页面是否存在
        if (pageNumber > pdf.numPages) {
          throw new Error(`页面 ${pageNumber} 不存在，总页数: ${pdf.numPages}`);
        }

        // 获取指定页面
        console.log(`[PDFPage] 开始获取页面 ${pageNumber}`);
        const page = await pdf.getPage(pageNumber);
        console.log(`[PDFPage] 页面 ${pageNumber} 获取成功`);

        // 创建独立的canvas用于渲染
        const offscreenCanvas = document.createElement('canvas');
        const context = offscreenCanvas.getContext('2d');
        if (!context) {
          console.error(`[PDFPage] 无法获取canvas上下文，页面 ${pageNumber}`);
          return;
        }

        // 计算缩放比例以适应容器
        const containerWidth = canvasRef.current?.parentElement?.clientWidth || 400;
        const containerHeight = canvasRef.current?.parentElement?.clientHeight || 600;
        console.log(`[PDFPage] 容器尺寸: ${containerWidth}x${containerHeight}, 页面 ${pageNumber}`);

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        console.log(`[PDFPage] 原始视口: ${viewport.width}x${viewport.height}, 缩放比例: ${scale}, 页面 ${pageNumber}`);

        // 设置offscreen canvas尺寸
        offscreenCanvas.width = scaledViewport.width;
        offscreenCanvas.height = scaledViewport.height;
        console.log(`[PDFPage] Offscreen Canvas尺寸设置: ${offscreenCanvas.width}x${offscreenCanvas.height}, 页面 ${pageNumber}`);

        // 渲染页面到offscreen canvas
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: offscreenCanvas,
        };

        console.log(`[PDFPage] 开始渲染页面 ${pageNumber}`);
        await page.render(renderContext).promise;
        console.log(`[PDFPage] 页面 ${pageNumber} 渲染完成`);

        // 将渲染结果转换为图片URL
        const imageDataUrl = offscreenCanvas.toDataURL('image/png');
        setRenderedImage(imageDataUrl);

        // 设置主canvas尺寸
        if (canvasRef.current) {
          canvasRef.current.width = scaledViewport.width;
          canvasRef.current.height = scaledViewport.height;

          // 将offscreen canvas的内容绘制到主canvas
          const mainContext = canvasRef.current.getContext('2d');
          if (mainContext) {
            mainContext.drawImage(offscreenCanvas, 0, 0);
          }
        }

        setLoading(false);

      } catch (err) {
        console.error(`[PDFPage] PDF渲染错误，页面 ${pageNumber}:`, err);
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(`页面 ${pageNumber} 加载失败: ${errorMessage}`);
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
