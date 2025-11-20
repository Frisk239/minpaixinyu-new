import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/DataCompilation.css';

interface DocumentItem {
  id: string;
  title: string;
  cityName: string;
  imagePath: string;
  pdfPath: string;
}

const DataCompilation: React.FC = () => {
  const navigate = useNavigate();
  const backgroundImage = useResponsiveImage('index');
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);

  // 资料汇编文档列表
  const documents: DocumentItem[] = [
    {
      id: 'fuzhou',
      title: '福州侯官文化文献资料汇编',
      cityName: 'fuzhou',
      imagePath: '/static/data-conpilation/image/fuzhou.png',
      pdfPath: '/static/data-conpilation/pdf/fuzhou.pdf'
    },
    {
      id: 'quanzhou',
      title: '泉州海丝文化文献资料汇编',
      cityName: 'quanzhou',
      imagePath: '/static/data-conpilation/image/quanzhou.png',
      pdfPath: '/static/data-conpilation/pdf/quanzhou.pdf'
    },
    {
      id: 'nanping',
      title: '南平朱子文化文献资料汇编',
      cityName: 'nanping',
      imagePath: '/static/data-conpilation/image/nanping.png',
      pdfPath: '/static/data-conpilation/pdf/nanping.pdf'
    },
    {
      id: 'longyan',
      title: '龙岩红色文化文献资料汇编',
      cityName: 'longyan',
      imagePath: '/static/data-conpilation/image/longyan.png',
      pdfPath: '/static/data-conpilation/pdf/longyan.pdf'
    },
    {
      id: 'putian',
      title: '莆田妈祖文化文献资料汇编',
      cityName: 'putian',
      imagePath: '/static/data-conpilation/image/putian.png',
      pdfPath: '/static/data-conpilation/pdf/putian.pdf'
    }
  ];

  const handleDocumentClick = (document: DocumentItem) => {
    setSelectedDocument(document);
  };

  const handleBack = () => {
    if (selectedDocument) {
      setSelectedDocument(null);
    } else {
      navigate('/audio-book');
    }
  };

  return (
    <div className="data-compilation-container">
      {/* 背景图片 */}
      <div className="data-compilation-background">
        <img
          src={backgroundImage}
          alt="资料汇编背景"
          className="background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="data-compilation-content">
        {/* 返回按钮 */}
        <button className="back-btn" onClick={handleBack}>
          ← {selectedDocument ? '返回资料列表' : '返回有声读物'}
        </button>

        {!selectedDocument ? (
          <>
            {/* 标题 */}
            <div className="category-title">资料汇编</div>

            {/* 文档网格 */}
            <div className="document-grid">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="document-card"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <img
                    src={doc.imagePath}
                    alt={doc.title}
                    className="document-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = window.document.createElement('div');
                      fallback.className = 'document-fallback';
                      fallback.textContent = doc.title;
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* PDF阅读器 */}
            <div className="pdf-reader-wrapper">
              <ScrollPDFReader
                pdfUrl={selectedDocument.pdfPath}
                documentTitle={selectedDocument.title}
                onBack={() => setSelectedDocument(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 滚动式PDF阅读器组件
interface ScrollPDFReaderProps {
  pdfUrl: string;
  onBack: () => void;
  documentTitle: string;
}

const ScrollPDFReader: React.FC<ScrollPDFReaderProps> = ({ pdfUrl, onBack, documentTitle }) => {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // 动态导入PDF.js
        const pdfjsLib = await import('pdfjs-dist');

        // 配置PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        const pagePromises = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          pagePromises.push(renderPageToImage(pdf, pageNum));
        }

        const pages = await Promise.all(pagePromises);
        setPdfPages(pages);
        setLoading(false);

      } catch (err) {
        console.error('加载PDF失败:', err);
        setError('PDF加载失败，请稍后重试');
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  const renderPageToImage = async (pdf: any, pageNum: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);

    // 计算合适的缩放比例，确保PDF页面宽度适合阅读器容器
    const containerWidth = 500; // 放宽25%：400 * 1.25 = 500
    const viewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale: Math.min(scale, 1.2) }); // 限制最大缩放

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;

    return canvas.toDataURL('image/png');
  };

  if (loading) {
    return (
      <div className="pdf-loading">
        <p>正在加载PDF文档...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="scroll-pdf-reader">
      {/* 标题和返回按钮在同一行 */}
      <div className="pdf-header">
        <h2 className="document-title">{documentTitle}</h2>
        <button className="pdf-back-btn" onClick={onBack}>
          ← 返回资料汇编页面
        </button>
      </div>

      {pdfPages.map((pageData, index) => (
        <div key={index} className="pdf-page-scroll">
          <img
            src={pageData}
            alt={`第 ${index + 1} 页`}
            className="pdf-page-image"
          />
        </div>
      ))}
    </div>
  );
};

export default DataCompilation;