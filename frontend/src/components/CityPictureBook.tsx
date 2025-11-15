import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/PDFReader.css';

// 配置PDF.js worker - 使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

interface CityPictureBookProps {}

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

const CityPictureBook: React.FC<CityPictureBookProps> = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const backgroundImage = useResponsiveImage('index');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isSinglePageMode, setIsSinglePageMode] = useState(false);

  // 检测屏幕尺寸，决定是否使用单页模式
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmallScreen = window.innerWidth < 1025; // 小于1024px使用单页模式
      setIsSinglePageMode(isSmallScreen);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 获取PDF总页数
  useEffect(() => {
    const loadPDF = async () => {
      if (!cityName) return;
      
      try {
        const pdfUrl = `/static/${cityName}/${cityName}-picture-book.pdf`;
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
      } catch (error) {
        console.error('加载PDF失败:', error);
        setTotalPages(0);
      }
    };

    loadPDF();
  }, [cityName]);

  const handlePrevPage = () => {
    if (currentPage > 1 && !isAnimating) {
      setAnimationDirection('right'); // 向右翻页动画
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 400);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !isAnimating) {
      setAnimationDirection('left'); // 向左翻页动画
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 400);
    }
  };

  const handleBack = () => {
    navigate('/audio-book');
  };

  // 获取城市中文名
  const getCityDisplayName = (code: string) => {
    const cityMap: Record<string, string> = {
      'fuzhou': '福州',
      'quanzhou': '泉州',
      'nanping': '南平',
      'longyan': '龙岩',
      'putian': '莆田'
    };
    return cityMap[code] || code;
  };

  // PDF文件路径
  const pdfUrl = cityName ? `/static/${cityName}/${cityName}-picture-book.pdf` : '';

  return (
    <div className="pdf-reader-container">
      {/* 背景图片 */}
      <div className="pdf-reader-background">
        <img
          src={backgroundImage}
          alt="城市绘本阅读器背景"
          className="pdf-background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="pdf-reader-content">
        {/* 返回按钮 */}
        <button className="back-btn" onClick={handleBack}>
          ← 返回有声读物
        </button>

        {/* 标题 */}
        <h1 className="city-picture-book-title">
          {getCityDisplayName(cityName || '')}文化绘本
        </h1>

        {/* PDF显示区域 */}
        <div className="pdf-display">
          <div className={`pdf-single-page ${isAnimating ? 'animating' : ''} ${animationDirection ? `flip-${animationDirection}` : ''}`}>
            <div className="pdf-page single-page">
              <PDFPage
                pageNumber={currentPage}
                pdfUrl={pdfUrl}
              />
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="pdf-controls">
          <button
            className="control-btn prev-btn"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isAnimating}
          >
            ◀ 上一页
          </button>

          <div className="page-info">
            <span>第 {currentPage} 页</span>
            <br />
            <small>共 {totalPages} 页</small>
          </div>

          <button
            className="control-btn next-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isAnimating}
          >
            下一页 ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default CityPictureBook;
