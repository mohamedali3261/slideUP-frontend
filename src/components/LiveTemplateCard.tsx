import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PresentationTemplate, SlideElement, SlideTemplate } from '@/data/templates';
import { IconRenderer } from './editor/IconRenderer';
import { getAnimationStyle, Animation } from './editor/AnimationControls';
import './LiveTemplateCard.css';

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

interface LiveTemplateCardProps {
  template: PresentationTemplate;
  description: string;
  category: string;
}

const FONT_WEIGHTS: Record<string, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

const renderChart = (config: SlideElement['chartConfig']) => {
  if (!config) return null;
  const { type, data } = config;
  const max = Math.max(...data.map(d => d.value), 1);

  if (type === 'bar') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: '100%', padding: 8, boxSizing: 'border-box' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, height: `${(d.value / max) * 100}%`, background: d.color || '#3b82f6', borderRadius: 3, minHeight: 2 }} />
        ))}
      </div>
    );
  }

  if (type === 'line') {
    const points = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 100},${100 - (d.value / max) * 100}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <polyline points={points} fill="none" stroke={data[0]?.color || '#3b82f6'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let acc = 0;
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {data.map((d, i) => {
          const start = (acc / total) * 360;
          acc += d.value;
          const end = (acc / total) * 360;
          const x1 = 50 + 40 * Math.cos(((start - 90) * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin(((start - 90) * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos(((end - 90) * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin(((end - 90) * Math.PI) / 180);
          const large = end - start > 180 ? 1 : 0;
          return <path key={i} d={`M50 50 L${x1} ${y1} A40 40 0 ${large} 1 ${x2} ${y2} Z`} fill={d.color || '#3b82f6'} />;
        })}
      </svg>
    );
  }

  return null;
};

const renderTable = (config: SlideElement['tableConfig']) => {
  if (!config) return null;
  const { cells, headerRow, headerBgColor, headerTextColor, borderColor, borderWidth, cellPadding, alternateRowColors, alternateColor } = config;
  return (
    <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
      <tbody>
        {cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => {
              const isHeader = headerRow && r === 0;
              return (
                <td
                  key={c}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  style={{
                    border: `${borderWidth || 1}px solid ${borderColor || '#e2e8f0'}`,
                    padding: `${cellPadding || 4}px`,
                    fontWeight: cell.fontWeight === 'bold' || isHeader ? 'bold' : 'normal',
                    textAlign: cell.textAlign || 'left',
                    color: isHeader && headerTextColor ? headerTextColor : cell.textColor || 'inherit',
                    background: isHeader && headerBgColor ? headerBgColor : alternateRowColors && alternateColor && r % 2 === 1 ? alternateColor : undefined,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cell.content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const renderCode = (config: SlideElement['codeConfig']) => {
  if (!config) return null;
  return (
    <pre style={{ margin: 0, padding: 8, fontSize: 8, lineHeight: 1.4, background: '#1e1e1e', color: '#d4d4d4', whiteSpace: 'pre-wrap', overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      {config.code}
    </pre>
  );
};

const renderElement = (element: SlideElement, animate: boolean) => {
  const anim = element.animation as Animation | undefined;
  const hasAnimation = anim && anim.type !== 'none';
  const animStyle = hasAnimation && animate ? getAnimationStyle({ ...anim, repeat: 1 }) : {};

  const base: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex || 1,
    opacity: element.opacity ?? 1,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    overflow: element.type === 'text' ? 'visible' : 'hidden',
    ...animStyle,
  };

  if (element.type === 'text') {
    return (
      <div key={element.id} style={base}>
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '4px 8px',
            boxSizing: 'border-box',
            fontSize: element.fontSize || 16,
            fontWeight: FONT_WEIGHTS[element.fontWeight || 'normal'] || 400,
            fontStyle: element.fontStyle || 'normal',
            textAlign: element.textAlign || 'left',
            textDecoration: element.textDecoration || 'none',
            textTransform: element.textTransform || 'none',
            lineHeight: element.lineHeight || 1.5,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
            fontFamily: element.fontFamily || 'inherit',
            color: element.color || '#000000',
            backgroundColor: element.backgroundColor,
            textShadow: element.textShadow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            whiteSpace: 'pre-wrap',
          }}
        >
          {element.content || ''}
        </div>
      </div>
    );
  }

  if (element.type === 'image' && element.imageUrl) {
    return (
      <div key={element.id} style={base}>
        <img
          src={element.imageUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.objectFit || 'cover',
            objectPosition: element.objectPosition || 'center center',
            borderRadius: element.borderRadius || 0,
            transform: `rotate(${element.imageRotation || 0}deg) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`,
          }}
        />
      </div>
    );
  }

  if (element.type === 'shape') {
    let inner: React.ReactNode = null;
    if (element.shapeType === 'line') {
      inner = <div className="absolute top-1/2 left-0 right-0 h-1" style={{ backgroundColor: element.backgroundColor || '#3b82f6' }} />;
    } else if (element.shapeType === 'arrow') {
      inner = (
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
          <polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill={element.backgroundColor || '#3b82f6'} />
        </svg>
      );
    } else {
      const shapeStyles: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: element.backgroundColor || (element.border ? 'transparent' : '#3b82f6'),
        borderRadius: element.shapeType === 'circle' ? '50%' : element.borderRadius || 8,
        ...(element.border ? { border: `${element.border.width}px ${element.border.style} ${element.border.color}` } : {}),
      };
      inner = <div style={shapeStyles} />;
    }
    return (
      <div key={element.id} style={base}>
        {inner}
      </div>
    );
  }

  if (element.type === 'icon' && element.iconConfig) {
    return (
      <div key={element.id} style={base}>
        <div className="w-full h-full flex items-center justify-center">
          <IconRenderer
            config={{
              ...element.iconConfig,
              size: Math.min(element.width, element.height) * 0.8,
            }}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  if (element.type === 'chart' && element.chartConfig) {
    return (
      <div key={element.id} style={base}>
        {renderChart(element.chartConfig)}
      </div>
    );
  }

  if (element.type === 'table' && element.tableConfig) {
    return (
      <div key={element.id} style={base}>
        {renderTable(element.tableConfig)}
      </div>
    );
  }

  if (element.type === 'code' && element.codeConfig) {
    return (
      <div key={element.id} style={base}>
        {renderCode(element.codeConfig)}
      </div>
    );
  }

  return null;
};

const renderFallback = (slide: SlideTemplate, direction: 'ltr' | 'rtl') => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        boxSizing: 'border-box',
        direction,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, color: 'inherit' }}>{slide.title}</div>
      {slide.subtitle && <div style={{ fontSize: 16, opacity: 0.75, marginTop: 8 }}>{slide.subtitle}</div>}
    </div>
  );
};

export const LiveTemplateCard = ({ template, description, category }: LiveTemplateCardProps) => {
  const { direction } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [hoverCount, setHoverCount] = useState(0);
  const [hasHovered, setHasHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / SLIDE_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slide = template.slides[0];
  const hasElements = slide.elements && slide.elements.length > 0;

  const handleUseTemplate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/editor?template=${template.id}`);
  };

  const handleMouseEnter = () => {
    setHasHovered(true);
    setHoverCount(c => c + 1);
  };

  return (
    <div className="live-card" onMouseEnter={handleMouseEnter} onClick={() => handleUseTemplate()}>
      <div ref={containerRef} className="live-card-preview">
        <div
          key={hoverCount}
          className="live-card-slide"
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            background: slide.backgroundColor,
            color: slide.textColor,
            direction,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {hasElements ? slide.elements.map(el => renderElement(el, hasHovered)) : renderFallback(slide, direction)}
        </div>

        {template.isNew && <span className="live-card-new-badge">NEW</span>}

        <div className="live-card-overlay">
          <button onClick={(e) => handleUseTemplate(e)} className="live-card-use-btn">
            <span className="material-symbols-outlined">arrow_outward</span>
          </button>
        </div>
      </div>

      <div className="live-card-content">
        <h3 className="text-base sm:text-lg">{template.titleKey}</h3>
        <p className="text-xs sm:text-sm">{description}</p>
        <span className="live-card-category">{category}</span>
      </div>
    </div>
  );
};

export default LiveTemplateCard;
