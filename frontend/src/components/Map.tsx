import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import axios from 'axios';
import '../styles/Map.css';

interface CityExploration {
  id: number;
  user_id: number;
  city_name: string;
  is_explored: boolean;
  explored_at: string | null;
  created_at: string;
}

interface MapProps {
  userId: number;
}

const Map: React.FC<MapProps> = ({ userId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [cityExplorations, setCityExplorations] = useState<CityExploration[]>([]);
  const [loading, setLoading] = useState(true);

  // 特殊城市列表
  const specialCities = useMemo(() =>
    ['福州市', '泉州市', '莆田市', '南平市', '龙岩市'],
    []
  );

  // 获取城市探索状态
  useEffect(() => {
    const fetchCityExplorations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/city-explorations');
        setCityExplorations(response.data.explorations);
      } catch (error) {
        console.error('获取城市探索状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCityExplorations();
    }
  }, [userId]);

  // 绘制地图
  useEffect(() => {
    if (loading || !svgRef.current) return;

    const drawMap = async () => {
      try {
        // 获取福建地图数据
        const response = await axios.get('http://localhost:5000/static/fujian.json');
        const fujianData = response.data;

        // 设置SVG尺寸
        const width = 800;
        const height = 600;

        // 清空之前的绘制
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', [0, 0, width, height]);

        // 创建投影
        const projection = d3.geoMercator()
          .center([118, 26]) // 福建中心坐标
          .scale(8000)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // 绘制地图
        svg.selectAll('path')
          .data(fujianData.features)
          .enter()
          .append('path')
          .attr('d', (d: any) => path(d))
          .attr('fill', (d: any) => {
            const cityName = d.properties.name;
            const exploration = cityExplorations.find(exp => exp.city_name === cityName);
            return exploration?.is_explored ? '#DAA520' : '#808080'; // 米黄色或灰色
          })
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('class', 'city-path')
          .on('mouseover', function(this: SVGPathElement, event: MouseEvent, d: any) {
            // 悬停效果 - 只保留高亮
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 2)
              .attr('stroke', '#000');
          })
          .on('mouseout', function(this: SVGPathElement) {
            // 恢复原始样式
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 1)
              .attr('stroke', '#fff');

            // 渐渐隐去提示
            const tooltip = d3.select('.map-tooltip');
            if (!tooltip.empty()) {
              tooltip
                .transition()
                .duration(300)
                .style('opacity', '0')
                .remove();
            }
          })
          .on('click', function(this: SVGPathElement, event: MouseEvent, d: any) {
            const cityName = d.properties.name;
            const isSpecial = specialCities.includes(cityName);

            if (isSpecial) {
              // 特殊城市跳转到详情页
              navigate(`/city/${encodeURIComponent(cityName)}`);
            } else {
              // 其他城市只显示提示
              const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'map-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(255, 69, 0, 0.9)')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('font-size', '14px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .html(`${cityName}<br/>此城市暂未开放探索`);

              tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');

              // 3秒后自动消失
              setTimeout(() => {
                tooltip.remove();
              }, 3000);
            }
          });

        // 添加城市名称标签
        svg.selectAll('text')
          .data(fujianData.features)
          .enter()
          .append('text')
          .attr('x', (d: any) => path.centroid(d)[0])
          .attr('y', (d: any) => path.centroid(d)[1])
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', '#333')
          .attr('font-family', 'FangZhengFengYaKaiSong, serif')
          .text((d: any) => d.properties.name);

        // 为未探索的特殊城市添加锁图标
        const lockGroup = svg.append('g').attr('class', 'lock-icons');

        fujianData.features.forEach((feature: any) => {
          const cityName = feature.properties.name;
          const exploration = cityExplorations.find(exp => exp.city_name === cityName);
          const isSpecial = specialCities.includes(cityName);

          if (!exploration?.is_explored && isSpecial) {
            const centroid = path.centroid(feature);
            if (centroid) {
              lockGroup.append('circle')
                .attr('cx', centroid[0])
                .attr('cy', centroid[1] - 20)
                .attr('r', 8)
                .attr('fill', '#FFD700')
                .attr('stroke', '#000')
                .attr('stroke-width', 1)
                .attr('class', 'lock-icon');

              lockGroup.append('text')
                .attr('x', centroid[0])
                .attr('y', centroid[1] - 16)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#000')
                .attr('font-weight', 'bold')
                .text('🔒');
            }
          }
        });

      } catch (error) {
        console.error('绘制地图失败:', error);
      }
    };

    drawMap();
  }, [cityExplorations, loading, navigate]);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>正在加载地图...</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>福建地图</h2>
        <div className="map-legend">
          <div className="legend-item">
            <div className="color-box explored"></div>
            <span>已探索</span>
          </div>
          <div className="legend-item">
            <div className="color-box unexplored"></div>
            <span>未探索</span>
          </div>
        </div>
      </div>
      <div className="map-svg-container">
        <svg ref={svgRef}></svg>
      </div>

    </div>
  );
};

export default Map;
