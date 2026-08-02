import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SlideTemplate, SlideElement } from '@/data/templates';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

// Constants for conversion
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;
// Editor canvas dimensions
const EDITOR_WIDTH = 960;
const EDITOR_HEIGHT = 540;
// Scale factor to convert editor coordinates to export coordinates
const SCALE_FACTOR = EXPORT_WIDTH / EDITOR_WIDTH; // = 2

const PPTX_WIDTH = 10;
const PPTX_HEIGHT = 5.625;

const pxToInchX = (px: number) => (px / EDITOR_WIDTH) * PPTX_WIDTH;
const pxToInchY = (px: number) => (px / EDITOR_HEIGHT) * PPTX_HEIGHT;
const pxToInchW = (px: number) => (px / EDITOR_WIDTH) * PPTX_WIDTH;
const pxToInchH = (px: number) => (px / EDITOR_HEIGHT) * PPTX_HEIGHT;

const getFontWeight = (weight?: string): boolean => {
  return weight === 'bold' || weight === 'semibold' || weight === 'extrabold';
};

export const exportToPptx = async (slides: SlideTemplate[], title: string) => {
  const pptx = new pptxgen();
  pptx.title = title;
  pptx.author = 'SlideSpark Studio';
  pptx.layout = 'LAYOUT_WIDE';
  
  for (const slide of slides) {
    const pptSlide = pptx.addSlide();
    
    if (slide.backgroundColor.startsWith('linear-gradient')) {
      const colorMatch = slide.backgroundColor.match(/#[a-fA-F0-9]{6}/);
      pptSlide.background = { color: colorMatch ? colorMatch[0].replace('#', '') : 'FFFFFF' };
    } else {
      pptSlide.background = { color: slide.backgroundColor.replace('#', '') };
    }

    if (slide.elements && slide.elements.length > 0) {
      for (const element of slide.elements) {
        await addElementToPptx(pptSlide, pptx, element);
      }
    } else {
      renderDefaultSlideContent(pptSlide, pptx, slide);
    }
  }

  await pptx.writeFile({ fileName: `${title}.pptx` });
};


const addElementToPptx = async (pptSlide: any, pptx: any, element: SlideElement) => {
  const x = pxToInchX(element.x);
  const y = pxToInchY(element.y);
  const w = pxToInchW(element.width);
  const h = pxToInchH(element.height);

  switch (element.type) {
    case 'text':
      pptSlide.addText(element.content || '', {
        x, y, w, h,
        fontSize: Math.round((element.fontSize || 16) * 0.75),
        bold: getFontWeight(element.fontWeight),
        italic: element.fontStyle === 'italic',
        color: (element.color || '#000000').replace('#', ''),
        align: element.textAlign || 'left',
        valign: element.verticalAlign === 'middle' ? 'middle' : element.verticalAlign === 'bottom' ? 'bottom' : 'top',
        fontFace: element.fontFamily?.split(',')[0]?.replace(/['"]/g, '') || 'Arial',
      });
      break;

    case 'shape':
      const shapeType = element.shapeType === 'circle' ? pptx.ShapeType.ellipse : 
                        element.shapeType === 'line' ? pptx.ShapeType.line :
                        pptx.ShapeType.rect;
      pptSlide.addShape(shapeType, {
        x, y, w, h,
        fill: { color: (element.backgroundColor || '#3b82f6').replace('#', '') },
      });
      break;

    case 'image':
      if (element.imageUrl) {
        try {
          pptSlide.addImage({ data: element.imageUrl, x, y, w, h });
        } catch (e) {
          console.warn('Failed to add image:', e);
        }
      }
      break;

    case 'table':
      if (element.tableConfig) {
        const tableData = element.tableConfig.cells.map(row => 
          row.map(cell => ({ text: cell.content || '', options: {} }))
        );
        pptSlide.addTable(tableData, { x, y, w, h, fontSize: 10, border: { pt: 1, color: '000000' } });
      }
      break;

    case 'code':
      if (element.codeConfig) {
        pptSlide.addText(element.codeConfig.code || '', {
          x, y, w, h, fontSize: 10, fontFace: 'Courier New', color: 'FFFFFF', fill: { color: '1e1e1e' },
        });
      }
      break;

    case 'icon':
      // Convert SVG icon to image for PPTX
      if (element.iconConfig) {
        const { name, color, size, strokeWidth, backgroundColor, backgroundRadius } = element.iconConfig;
        const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
        const IconComponent = icons[name];
        
        if (IconComponent) {
          try {
            // Render icon to SVG string
            const svgString = renderToStaticMarkup(
              createElement(IconComponent, {
                width: size * 2,
                height: size * 2,
                color: color,
                strokeWidth: strokeWidth,
              })
            );
            
            // Create a canvas to convert SVG to PNG
            const canvas = document.createElement('canvas');
            const padding = backgroundColor ? 24 : 0;
            canvas.width = size * 2 + padding * 2;
            canvas.height = size * 2 + padding * 2;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Draw background if exists
              if (backgroundColor) {
                ctx.fillStyle = backgroundColor;
                if (backgroundRadius && backgroundRadius > 0) {
                  // Rounded rectangle
                  const radius = Math.min(backgroundRadius, canvas.width / 2);
                  ctx.beginPath();
                  ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
                  ctx.fill();
                } else {
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
              }
              
              // Convert SVG to image
              const img = new Image();
              const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  ctx.drawImage(img, padding, padding);
                  URL.revokeObjectURL(url);
                  resolve();
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  resolve();
                };
                img.src = url;
              });
              
              // Get base64 image
              const imageData = canvas.toDataURL('image/png');
              pptSlide.addImage({ data: imageData, x, y, w, h });
            }
          } catch (e) {
            console.warn('Failed to render icon for PPTX:', name, e);
            // Fallback to colored shape
            const bgColor = backgroundColor || color || '#3b82f6';
            pptSlide.addShape(pptx.ShapeType.ellipse, {
              x, y, w, h,
              fill: { color: bgColor.replace('#', '') },
            });
          }
        }
      }
      break;

    case 'chart':
      // For PPTX, render chart data as a simple table representation
      if (element.chartConfig) {
        const chartData = element.chartConfig.data || [];
        if (chartData.length > 0) {
          const tableData = [
            [{ text: 'Name', options: { bold: true } }, { text: 'Value', options: { bold: true } }],
            ...chartData.map(item => [{ text: item.name || '', options: {} }, { text: String(item.value || 0), options: {} }])
          ];
          pptSlide.addTable(tableData, { x, y, w, h, fontSize: 10, border: { pt: 1, color: '000000' } });
        }
      }
      break;

    case 'video':
    case 'audio':
      // Media elements can't be exported to static formats, show placeholder
      if (element.mediaConfig) {
        pptSlide.addText(`[${element.type.toUpperCase()}]`, {
          x, y, w, h,
          fontSize: 14,
          color: '666666',
          align: 'center',
          valign: 'middle',
          fill: { color: 'f0f0f0' },
        });
      }
      break;
  }
};

const renderDefaultSlideContent = (pptSlide: any, pptx: any, slide: SlideTemplate) => {
  const textColor = slide.textColor.replace('#', '');

  switch (slide.type) {
    case 'cover':
      pptSlide.addText(slide.title, { x: 0.5, y: '35%', w: '90%', h: 1.2, fontSize: 44, bold: true, color: textColor, align: 'center' });
      if (slide.subtitle) {
        pptSlide.addText(slide.subtitle, { x: 0.5, y: '55%', w: '90%', h: 0.6, fontSize: 24, color: textColor, align: 'center' });
      }
      break;

    case 'content':
      pptSlide.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 32, bold: true, color: textColor });
      if (slide.content) {
        slide.content.forEach((item, index) => {
          pptSlide.addText(`• ${item}`, { x: 0.7, y: 1.5 + index * 0.5, w: '85%', h: 0.45, fontSize: 18, color: textColor });
        });
      }
      break;

    case 'thankyou':
      pptSlide.addText(slide.title, { x: 0.5, y: '35%', w: '90%', h: 1.2, fontSize: 54, bold: true, color: textColor, align: 'center' });
      if (slide.subtitle) {
        pptSlide.addText(slide.subtitle, { x: 0.5, y: '55%', w: '90%', h: 0.6, fontSize: 28, color: textColor, align: 'center' });
      }
      break;

    default:
      pptSlide.addText(slide.title, { x: 0.5, y: '40%', w: '90%', h: 1, fontSize: 36, bold: true, color: textColor, align: 'center' });
      if (slide.subtitle) {
        pptSlide.addText(slide.subtitle, { x: 0.5, y: '55%', w: '90%', h: 0.5, fontSize: 20, color: textColor, align: 'center' });
      }
      break;
  }
};


// Export ALL slides to PDF
export const exportToPdf = async (slides: SlideTemplate[], title: string) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

  for (let i = 0; i < slides.length; i++) {
    const slideHtml = await renderSlideToHtml(slides[i], i);
    
    if (i > 0) pdf.addPage([1920, 1080], 'landscape');

    try {
      const canvas = await html2canvas(slideHtml, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: 1920,
        height: 1080,
        backgroundColor: slides[i].backgroundColor,
        logging: false,
        windowWidth: 1920,
        windowHeight: 1080,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });
      // Use JPEG with 0.9 quality for smaller file size
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1920, 1080);
    } catch (e) {
      console.error('Error rendering slide', i, e);
    }
    slideHtml.remove();
  }

  pdf.save(`${title}.pdf`);
};

// Export ALL slides to images
export const exportToImages = async (slides: SlideTemplate[], title: string) => {
  for (let i = 0; i < slides.length; i++) {
    const slideHtml = await renderSlideToHtml(slides[i], i);

    try {
      const canvas = await html2canvas(slideHtml, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: 1920,
        height: 1080,
        backgroundColor: slides[i].backgroundColor,
        logging: false,
        windowWidth: 1920,
        windowHeight: 1080,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });
      const link = document.createElement('a');
      link.download = `${title}-slide-${i + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error('Error rendering slide', i, e);
    }
    slideHtml.remove();
  }
};


const renderSlideToHtml = async (slide: SlideTemplate, index: number): Promise<HTMLDivElement> => {
  const container = document.createElement('div');
  container.id = `export-slide-${index}`;
  container.style.cssText = `
    position: absolute; left: -9999px; top: 0; width: 1920px; height: 1080px;
    background: ${slide.backgroundColor}; color: ${slide.textColor};
    font-family: system-ui, -apple-system, sans-serif; overflow: hidden;
    box-sizing: border-box;
  `;

  if (slide.elements && slide.elements.length > 0) {
    for (const element of slide.elements) {
      container.appendChild(renderElementToHtml(element, slide));
    }
  } else {
    container.appendChild(renderDefaultContentToHtml(slide));
  }

  document.body.appendChild(container);
  // Wait for fonts and images to load
  await new Promise(r => setTimeout(r, 200));
  // Force layout recalculation
  void container.offsetHeight;
  return container;
};

const renderElementToHtml = (element: SlideElement, slide: SlideTemplate): HTMLElement => {
  const el = document.createElement('div');
  
  // Scale element position and size from editor coordinates to export coordinates
  const scaledX = element.x * SCALE_FACTOR;
  const scaledY = element.y * SCALE_FACTOR;
  const scaledWidth = element.width * SCALE_FACTOR;
  const scaledHeight = element.height * SCALE_FACTOR;
  const scaledFontSize = (element.fontSize || 16) * SCALE_FACTOR;
  
  el.style.cssText = `
    position: absolute; left: ${scaledX}px; top: ${scaledY}px;
    width: ${scaledWidth}px; height: ${scaledHeight}px; opacity: ${element.opacity ?? 1};
    box-sizing: border-box;
  `;

  switch (element.type) {
    case 'text':
      el.style.cssText += `
        font-size: ${scaledFontSize}px; font-weight: ${element.fontWeight || 'normal'};
        font-style: ${element.fontStyle || 'normal'}; text-align: ${element.textAlign || 'left'};
        color: ${element.color || slide.textColor}; font-family: ${element.fontFamily || 'inherit'};
        line-height: ${element.lineHeight || 1.5}; letter-spacing: ${(element.letterSpacing || 0) * SCALE_FACTOR}px;
        text-decoration: ${element.textDecoration || 'none'}; text-transform: ${element.textTransform || 'none'};
        display: flex; padding: ${8 * SCALE_FACTOR}px; white-space: pre-wrap; word-wrap: break-word; overflow: visible;
        align-items: ${element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'};
        justify-content: ${element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'};
      `;
      if (element.backgroundColor) el.style.backgroundColor = element.backgroundColor;
      const textSpan = document.createElement('span');
      textSpan.style.cssText = 'display: block; width: 100%;';
      textSpan.textContent = element.content || '';
      el.appendChild(textSpan);
      break;

    case 'shape':
      const scaledBorderRadius = (element.borderRadius || 0) * SCALE_FACTOR;
      el.style.cssText += `
        background-color: ${element.backgroundColor || '#3b82f6'};
        border-radius: ${element.shapeType === 'circle' ? '50%' : scaledBorderRadius + 'px'};
      `;
      if (element.border) el.style.border = `${element.border.width * SCALE_FACTOR}px ${element.border.style} ${element.border.color}`;
      break;

    case 'image':
      if (element.imageUrl) {
        const img = document.createElement('img');
        img.src = element.imageUrl;
        img.style.cssText = `width: 100%; height: 100%; object-fit: ${element.objectFit || 'cover'}; border-radius: ${(element.borderRadius || 0) * SCALE_FACTOR}px;`;
        el.appendChild(img);
      }
      break;

    case 'table':
      if (element.tableConfig) {
        const table = document.createElement('table');
        table.style.cssText = `width: 100%; height: 100%; border-collapse: collapse; font-size: ${14 * SCALE_FACTOR}px;`;
        element.tableConfig.cells.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          row.forEach((cell) => {
            const td = document.createElement(rowIndex === 0 && element.tableConfig?.headerRow ? 'th' : 'td');
            td.textContent = cell.content || '';
            td.style.cssText = `border: 1px solid ${element.tableConfig?.borderColor || '#e5e7eb'}; padding: ${8 * SCALE_FACTOR}px; text-align: ${cell.textAlign || 'left'};`;
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
        el.appendChild(table);
      }
      break;

    case 'code':
      if (element.codeConfig) {
        el.style.cssText += `background-color: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', monospace; font-size: ${14 * SCALE_FACTOR}px; padding: ${16 * SCALE_FACTOR}px; border-radius: ${8 * SCALE_FACTOR}px; white-space: pre; overflow: auto;`;
        el.textContent = element.codeConfig.code || '';
      }
      break;

    case 'icon':
      if (element.iconConfig) {
        const { name, color, size, strokeWidth, backgroundColor, backgroundRadius, rotation } = element.iconConfig;
        const scaledSize = size * SCALE_FACTOR;
        const scaledPadding = backgroundColor ? 12 * SCALE_FACTOR : 0;
        const scaledBgRadius = (backgroundRadius || 0) * SCALE_FACTOR;
        
        el.style.cssText += `
          display: flex; align-items: center; justify-content: center;
          ${rotation ? `transform: rotate(${rotation}deg);` : ''}
        `;
        
        // Create background container if needed
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
          display: flex; align-items: center; justify-content: center;
          background-color: ${backgroundColor || 'transparent'};
          border-radius: ${scaledBgRadius}px;
          padding: ${scaledPadding}px;
        `;
        
        // Get the Lucide icon component and render it as SVG
        const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
        const IconComponent = icons[name];
        
        if (IconComponent) {
          try {
            const svgString = renderToStaticMarkup(
              createElement(IconComponent, {
                width: scaledSize,
                height: scaledSize,
                color: color,
                strokeWidth: strokeWidth,
              })
            );
            iconContainer.innerHTML = svgString;
          } catch (e) {
            console.warn('Failed to render icon:', name, e);
            iconContainer.innerHTML = `<svg width="${scaledSize}" height="${scaledSize}"></svg>`;
          }
        }
        
        el.appendChild(iconContainer);
      }
      break;

    case 'chart':
      if (element.chartConfig) {
        const chartData = element.chartConfig.data || [];
        const chartType = element.chartConfig.type || 'bar';
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
        
        el.style.cssText += `display: flex; flex-direction: column; padding: ${16 * SCALE_FACTOR}px; background: #f8f9fa; border-radius: ${8 * SCALE_FACTOR}px;`;
        
        if (chartType === 'pie') {
          // Simple pie chart representation using CSS conic-gradient
          const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0);
          const gradientParts: string[] = [];
          let currentAngle = 0;
          
          chartData.forEach((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 360 : 0;
            const color = item.color || colors[index % colors.length];
            gradientParts.push(`${color} ${currentAngle}deg ${currentAngle + percentage}deg`);
            currentAngle += percentage;
          });
          
          const pieSize = Math.min(scaledWidth, scaledHeight) * 0.6;
          const pieContainer = document.createElement('div');
          pieContainer.style.cssText = `
            width: ${pieSize}px; height: ${pieSize}px; border-radius: 50%; margin: auto;
            background: conic-gradient(${gradientParts.join(', ')});
          `;
          el.appendChild(pieContainer);
        } else {
          // Bar/Line chart as simple bars
          const maxValue = Math.max(...chartData.map(d => d.value || 0), 1);
          const barContainer = document.createElement('div');
          barContainer.style.cssText = `display: flex; align-items: flex-end; justify-content: space-around; height: 80%; width: 100%; padding-top: ${16 * SCALE_FACTOR}px;`;
          
          chartData.forEach((item, index) => {
            const barHeight = ((item.value || 0) / maxValue) * 100;
            const color = item.color || colors[index % colors.length];
            const barWrapper = document.createElement('div');
            barWrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%;`;
            barWrapper.innerHTML = `
              <div style="flex: 1; display: flex; align-items: flex-end; width: 100%; justify-content: center;">
                <div style="width: 60%; height: ${barHeight}%; background: ${color}; border-radius: ${4 * SCALE_FACTOR}px ${4 * SCALE_FACTOR}px 0 0;"></div>
              </div>
              <div style="font-size: ${12 * SCALE_FACTOR}px; margin-top: ${8 * SCALE_FACTOR}px; text-align: center; color: #333;">${item.name || ''}</div>
            `;
            barContainer.appendChild(barWrapper);
          });
          el.appendChild(barContainer);
        }
      }
      break;

    case 'video':
    case 'audio':
      // Media elements can't be exported to static images, show placeholder
      el.style.cssText += `
        display: flex; align-items: center; justify-content: center;
        background: #f0f0f0; border-radius: ${8 * SCALE_FACTOR}px;
        font-size: ${24 * SCALE_FACTOR}px; color: #666;
      `;
      el.textContent = `[${element.type.toUpperCase()}]`;
      break;
  }

  return el;
};


const renderDefaultContentToHtml = (slide: SlideTemplate): HTMLElement => {
  const container = document.createElement('div');
  container.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; padding: 80px;';

  switch (slide.type) {
    case 'cover':
    case 'thankyou':
      container.style.cssText += 'align-items: center; justify-content: center; text-align: center;';
      container.innerHTML = `
        <h1 style="font-size: ${slide.type === 'thankyou' ? '96px' : '80px'}; font-weight: bold; margin: 0;">${slide.title}</h1>
        ${slide.subtitle ? `<p style="font-size: 36px; margin-top: 24px; opacity: 0.8;">${slide.subtitle}</p>` : ''}
      `;
      break;

    case 'content':
      container.innerHTML = `
        <h2 style="font-size: 56px; font-weight: bold; margin: 0 0 48px 0;">${slide.title}</h2>
        <div style="flex: 1;">
          ${(slide.content || []).map(item => `
            <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; font-size: 28px;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background: ${slide.textColor}; margin-top: 10px; flex-shrink: 0;"></span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
      `;
      break;

    case 'section':
      container.style.cssText += 'align-items: center; justify-content: center; text-align: center;';
      container.innerHTML = `
        <h1 style="font-size: 72px; font-weight: bold; margin: 0;">${slide.title}</h1>
        ${slide.subtitle ? `<p style="font-size: 28px; margin-top: 16px; opacity: 0.7;">${slide.subtitle}</p>` : ''}
      `;
      break;

    default:
      container.style.cssText += 'align-items: center; justify-content: center; text-align: center;';
      container.innerHTML = `
        <h1 style="font-size: 64px; font-weight: bold; margin: 0;">${slide.title}</h1>
        ${slide.subtitle ? `<p style="font-size: 28px; margin-top: 16px; opacity: 0.8;">${slide.subtitle}</p>` : ''}
      `;
      break;
  }

  return container;
};
