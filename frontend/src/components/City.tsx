import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/City.css';

interface CityExploration {
  id: number;
  user_id: number;
  city_name: string;
  is_explored: boolean;
  explored_at: string | null;
  created_at: string;
}

interface CultureLink {
  title: string;
  url: string;
  source: string;
  fileName: string;
}

interface ExpertFile {
  name: string;
  path: string;
}

type ActiveTab = 'map' | 'overview' | 'experts' | 'youth';

const City: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const [cityExploration, setCityExploration] = useState<CityExploration | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [cultureLinks, setCultureLinks] = useState<CultureLink[]>([]);
  const [expertFiles, setExpertFiles] = useState<ExpertFile[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  // 特殊城市列表
  const specialCities = ['福州市', '泉州市', '莆田市', '南平市', '龙岩市'];

  // 城市名称映射
  const cityMapping: { [key: string]: string } = {
    '福州市': 'fuzhou',
    '泉州市': 'quanzhou',
    '南平市': 'nanping',
    '龙岩市': 'longyan',
    '莆田市': 'putian'
  };

  useEffect(() => {
    if (!cityName || !specialCities.includes(decodeURIComponent(cityName))) {
      navigate('/home');
      return;
    }

    fetchCityData();
  }, [cityName, navigate]);

  const fetchCityData = async () => {
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      console.log('正在获取城市数据:', decodedCityName);
      const response = await axios.get(`http://localhost:5000/api/city-explorations/${encodeURIComponent(decodedCityName)}`);
      console.log('城市数据响应:', response.data);
      setCityExploration(response.data.exploration);
    } catch (error: any) {
      console.error('获取城市数据失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsExplored = async () => {
    if (!cityExploration || cityExploration.is_explored) return;

    setUpdating(true);
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      const response = await axios.post(`http://localhost:5000/api/city-explorations/${encodeURIComponent(decodedCityName)}/explore`);
      setCityExploration(response.data.exploration);

      // 显示解锁动画
      showUnlockAnimation();
    } catch (error) {
      console.error('标记探索失败:', error);
      alert('标记探索失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const showUnlockAnimation = () => {
    const animationContainer = document.createElement('div');
    animationContainer.className = 'unlock-animation';
    animationContainer.innerHTML = `
      <div class="unlock-content">
        <img src="http://localhost:5000/static/image/unloc.gif" alt="解锁动画" class="unlock-gif" />
        <div class="unlock-text">城市已解锁！</div>
      </div>
    `;

    document.body.appendChild(animationContainer);

    // 3秒后自动移除动画
    setTimeout(() => {
      if (animationContainer.parentNode) {
        animationContainer.parentNode.removeChild(animationContainer);
      }
    }, 3000);
  };

  const goBackToHome = () => {
    navigate('/home');
  };

  // 切换标签页
  const handleTabChange = async (tab: ActiveTab) => {
    setActiveTab(tab);
    setContentLoading(true);

    try {
      if (tab === 'overview') {
        await loadCultureOverview();
      } else if (tab === 'experts') {
        await loadExpertFiles();
      }
    } catch (error) {
      console.error('加载内容失败:', error);
    } finally {
      setContentLoading(false);
    }
  };

  // 加载文化概览
  const loadCultureOverview = async () => {
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      const cityKey = cityMapping[decodedCityName];

      // 获取culture-introduction文件夹中的所有txt文件
      const response = await axios.get(`http://localhost:5000/api/city/${cityKey}/culture-files`);
      const files = response.data.files;

      const allLinks: CultureLink[] = [];

      // 解析每个txt文件
      for (const file of files) {
        try {
          const fileResponse = await axios.get(`http://localhost:5000/api/city/${cityKey}/culture-file/${file}`);
          const content = fileResponse.data.content;
          const links = parseCultureLinks(content, file);
          allLinks.push(...links);
        } catch (error) {
          console.error(`解析文件 ${file} 失败:`, error);
        }
      }

      setCultureLinks(allLinks);
    } catch (error) {
      console.error('加载文化概览失败:', error);
      setCultureLinks([]);
    }
  };

  // 加载专家文件
  const loadExpertFiles = async () => {
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      const cityKey = cityMapping[decodedCityName];

      const response = await axios.get(`http://localhost:5000/api/city/${cityKey}/expert-files`);
      setExpertFiles(response.data.files);
    } catch (error) {
      console.error('加载专家文件失败:', error);
      setExpertFiles([]);
    }
  };

  // 解析文化链接
  const parseCultureLinks = (content: string, fileName: string): CultureLink[] => {
    const links: CultureLink[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    for (let i = 0; i < lines.length; i += 2) {
      const titleLine = lines[i];
      const sourceLine = lines[i + 1];

      if (titleLine && sourceLine) {
        // 解析标题和URL
        const titleMatch = titleLine.match(/《(.+)》(.+)/);
        const sourceMatch = sourceLine.match(/来源：(.+)/);

        if (titleMatch && sourceMatch) {
          links.push({
            title: titleMatch[1],
            url: titleMatch[2].trim(),
            source: sourceMatch[1],
            fileName: fileName
          });
        }
      }
    }

    return links;
  };

  // 打开外部链接
  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="city-loading">
        <div className="loading-spinner"></div>
        <p>正在加载城市信息...</p>
      </div>
    );
  }

  if (!cityExploration) {
    return (
      <div className="city-error">
        <h2>城市信息加载失败</h2>
        <button onClick={goBackToHome} className="city-back-btn">
          返回文化云游
        </button>
      </div>
    );
  }

  const decodedCityName = decodeURIComponent(cityName!);
  const cityKey = cityMapping[decodedCityName];

  return (
    <div className="city-detail-container">
      {/* 背景图片 */}
      <div className="city-background">
        <img
          src="http://localhost:5000/static/image/index.png"
          alt="背景图片"
          className="city-background-img"
        />
      </div>

      {/* 主要内容 */}
      <div className="city-detail-content">
        {/* 左侧边栏 */}
        <div className="city-sidebar">
          <div className="sidebar-header">
            <h2>{decodedCityName}</h2>
            <div className="city-status">
              <span className={`status-badge ${cityExploration.is_explored ? 'explored' : 'unexplored'}`}>
                {cityExploration.is_explored ? '已探索' : '未探索'}
              </span>
            </div>
          </div>

          <div className="sidebar-nav">
            <button
              className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => handleTabChange('map')}
            >
              文化地点分布
            </button>
            <button
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              文化概览
            </button>
            <button
              className={`nav-btn ${activeTab === 'experts' ? 'active' : ''}`}
              onClick={() => handleTabChange('experts')}
            >
              专家有话说
            </button>
            <button
              className={`nav-btn ${activeTab === 'youth' ? 'active' : ''}`}
              onClick={() => handleTabChange('youth')}
            >
              青年有话说
            </button>
          </div>

          <div className="sidebar-actions">
            <div className="action-buttons-row">
              {!cityExploration.is_explored && (
                <button
                  onClick={markAsExplored}
                  disabled={updating}
                  className="explore-btn"
                >
                  {updating ? '标记中...' : '标记为已探索'}
                </button>
              )}

              <button
                onClick={goBackToHome}
                className="city-back-btn"
              >
                返回文化云游
              </button>
            </div>

            {cityExploration.is_explored && (
              <div className="explored-status">
                <div className="explored-badge">
                  <span className="checkmark">✓</span>
                  <span>已探索完成</span>
                </div>
                <div className="explored-time">
                  {new Date(cityExploration.explored_at!).toLocaleString('zh-CN')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="city-content-area">
          {contentLoading && (
            <div className="content-loading">
              <div className="loading-spinner"></div>
              <p>正在加载内容...</p>
            </div>
          )}

          {/* 文化地点分布 */}
          {activeTab === 'map' && !contentLoading && (
            <div className="content-section">
              <div className="city-image-container">
                <img
                  src={`http://localhost:5000/static/${cityKey}/${cityKey}.PNG`}
                  alt={`${decodedCityName}文化地点分布`}
                  className="city-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'http://localhost:5000/static/image/index.png';
                  }}
                />
              </div>
            </div>
          )}

          {/* 文化概览 */}
          {activeTab === 'overview' && !contentLoading && (
            <div className="content-section">
              <h3>文化概览</h3>
              {cultureLinks.length > 0 ? (
                <div className="culture-links">
                  {cultureLinks.map((link, index) => (
                    <div
                      key={index}
                      className="culture-link-item"
                      onClick={() => openExternalLink(link.url)}
                    >
                      <div className="link-title">{link.title}</div>
                      <div className="link-source">来源：{link.source}</div>
                      <div className="link-file">来自：{link.fileName}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-content">
                  <p>暂无文化概览内容</p>
                </div>
              )}
            </div>
          )}

          {/* 专家有话说 */}
          {activeTab === 'experts' && !contentLoading && (
            <div className="content-section">
              <h3>专家有话说</h3>
              {expertFiles.length > 0 ? (
                <div className="expert-files">
                  {expertFiles.map((file, index) => (
                    <div
                      key={index}
                      className="expert-file-item"
                      onClick={() => {
                        // TODO: 打开Word阅读器
                        console.log('打开文件:', file.path);
                      }}
                    >
                      <div className="file-icon">📄</div>
                      <div className="file-name">{file.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-content">
                  <p>暂无专家文件</p>
                </div>
              )}
            </div>
          )}

          {/* 青年有话说 */}
          {activeTab === 'youth' && !contentLoading && (
            <div className="content-section">
              <h3>青年有话说</h3>
              <div className="word-viewer">
                {/* TODO: 集成Word阅读器 */}
                <div className="word-placeholder">
                  <p>Word文档阅读器</p>
                  <p>文件：{cityKey}/report.docx</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default City;
