import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SlideTemplate, SlideElement } from '@/data/templates';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import JSZip from 'jszip';

// Base export resolution (kept at 1920px wide; height follows the canvas aspect ratio)
const EXPORT_WIDTH = 1920;

const getFontWeight = (weight?: string): boolean => {
  return weight === 'bold' || weight === 'semibold' || weight === 'extrabold';
};

const TRANSITION_XML_BY_TYPE: Record<string, string> = {
  fade: '<p:fade/>',
  dissolve: '<p:dissolve/>',
  'slide-left': '<p:push dir="l"/>',
  'slide-right': '<p:push dir="r"/>',
  'slide-up': '<p:push dir="t"/>',
  'slide-down': '<p:push dir="b"/>',
  'wipe-left': '<p:wipe dir="l"/>',
  'wipe-right': '<p:wipe dir="r"/>',
  'wipe-up': '<p:wipe dir="t"/>',
  'wipe-down': '<p:wipe dir="b"/>',
  zoom: '<p:zoom dir="in"/>',
  'zoom-rotate': '<p:zoom dir="in"/>',
  circle: '<p:circle/>',
  diamond: '<p:diamond/>',
  blinds: '<p:blinds/>',
  'flip-x': '<p15:flip dir="l"/>',
  'flip-y': '<p15:flip dir="t"/>',
  'flip-3d': '<p15:flip dir="l"/>',
  cube: '<p15:cube dir="l"/>',
  'cube-left': '<p15:cube dir="l"/>',
  'cube-right': '<p15:cube dir="r"/>',
  carousel: '<p15:gallery/>',
  pixelate: '<p15:pixelate/>',
};

const FALLBACK_TRANSITION_XML = '<p:fade/>';

const buildTransitionXml = (type: string, durationSeconds?: number): string => {
  const inner = TRANSITION_XML_BY_TYPE[type] || FALLBACK_TRANSITION_XML;
  const durMs = Math.round((durationSeconds && durationSeconds > 0 ? durationSeconds : 0.5) * 1000);
  const spd = durMs <= 500 ? 'fast' : durMs >= 1500 ? 'slow' : 'med';
  return `<p:transition spd="${spd}" p14:dur="${durMs}">${inner}</p:transition>`;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const applySlideTransitionsToPptx = async (
  blob: Blob,
  slides: SlideTemplate[],
  transitions: Record<string, { type: string; duration?: number }>
): Promise<Blob> => {
  const zip = await JSZip.loadAsync(blob);
  const p14Ns = 'xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"';
  const p15Ns = 'xmlns:p15="http://schemas.microsoft.com/office/powerpoint/2012/main"';

  for (let i = 0; i < slides.length; i++) {
    const transition = transitions[slides[i].id];
    if (!transition || !transition.type || transition.type === 'none') continue;

    const slidePath = `ppt/slides/slide${i + 1}.xml`;
    const slideFile = zip.file(slidePath);
    if (!slideFile) continue;

    const xml = await slideFile.async('string');
    const transitionXml = buildTransitionXml(transition.type, transition.duration);
    if (!transitionXml) continue;

    let nextXml = xml;
    if (xml.indexOf('xmlns:p14=') === -1) {
      nextXml = nextXml.replace('<p:sld ', `<p:sld ${p14Ns} `);
    }
    if (transitionXml.indexOf('p15:') !== -1 && xml.indexOf('xmlns:p15=') === -1) {
      nextXml = nextXml.replace('<p:sld ', `<p:sld ${p15Ns} `);
    }
    nextXml = nextXml.replace('</p:sld>', `${transitionXml}</p:sld>`);
    zip.file(slidePath, nextXml);
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    compression: 'DEFLATE',
  });
};

export const exportToPptx = async (
  slides: SlideTemplate[],
  title: string,
  canvasWidth = 960,
  canvasHeight = 540,
  slideTransitions?: Record<string, { type: string; duration?: number }>
) => {
  const pptx = new pptxgen();
  pptx.title = title;
  pptx.author = 'SlideSpark Studio';
  
  // Build the slide layout to match the canvas aspect ratio (10in wide)
  const pptxWidth = 10;
  const pptxHeight = (pptxWidth * canvasHeight) / canvasWidth;
  pptx.defineLayout({ name: 'CUSTOM', width: pptxWidth, height: pptxHeight });
  pptx.layout = 'CUSTOM';
  
  const toInchX = (px: number) => (px / canvasWidth) * pptxWidth;
  const toInchY = (px: number) => (px / canvasHeight) * pptxHeight;
  const toInchW = (px: number) => (px / canvasWidth) * pptxWidth;
  const toInchH = (px: number) => (px / canvasHeight) * pptxHeight;
  
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
        await addElementToPptx(pptSlide, pptx, element, toInchX, toInchY, toInchW, toInchH);
      }
    } else {
      renderDefaultSlideContent(pptSlide, pptx, slide);
    }
  }

  const hasTransitions = slideTransitions
    && Object.keys(slideTransitions).some(
      (id) => slideTransitions[id] && slideTransitions[id].type && slideTransitions[id].type !== 'none'
    );

  if (hasTransitions) {
    const pptxAny = pptx as unknown as { exportPresentation: (props: Record<string, unknown>) => Promise<Blob> };
    const blob = await pptxAny.exportPresentation({ outputType: 'blob', compression: false });
    const finalBlob = await applySlideTransitionsToPptx(blob, slides, slideTransitions!);
    downloadBlob(finalBlob, `${title}.pptx`);
  } else {
    await pptx.writeFile({ fileName: `${title}.pptx` });
  }
};


const addElementToPptx = async (pptSlide: any, pptx: any, element: SlideElement,
  toInchX: (px: number) => number, toInchY: (px: number) => number,
  toInchW: (px: number) => number, toInchH: (px: number) => number) => {

  // Skip invisible elements
  if (element.visible === false) return;

  const x = toInchX(element.x);
  const y = toInchY(element.y);
  const w = toInchW(element.width);
  const h = toInchH(element.height);
  const rotate = element.rotation || 0;

  // Helper: strip # and handle gradients by extracting dominant colour
  const toHex = (c?: string): string => {
    if (!c) return 'FFFFFF';
    if (c.includes('gradient')) {
      const m = c.match(/#([a-fA-F0-9]{6})/);
      return m ? m[1] : 'FFFFFF';
    }
    return c.replace('#', '');
  };

  switch (element.type) {
    case 'text': {
      const opts: Record<string, any> = {
        x, y, w, h,
        fontSize: Math.round((element.fontSize || 16) * 0.75),
        bold: getFontWeight(element.fontWeight),
        italic: element.fontStyle === 'italic',
        underline: element.textDecoration === 'underline' ? { style: 'sng' } : undefined,
        strike: element.textDecoration === 'line-through' ? 'sngStrike' : undefined,
        color: toHex(element.color || '#000000'),
        align: element.textAlign === 'justify' ? 'left' : (element.textAlign || 'left'),
        valign: element.verticalAlign === 'middle' ? 'middle' : element.verticalAlign === 'bottom' ? 'bottom' : 'top',
        fontFace: element.fontFamily?.split(',')[0]?.replace(/['"]/g, '').trim() || 'Arial',
        charSpacing: element.letterSpacing ? element.letterSpacing * 0.1 : undefined,
        lineSpacingMultiple: element.lineHeight || undefined,
        rotate,
      };
      if (element.backgroundColor && !element.backgroundColor.includes('gradient')) {
        opts.fill = { color: toHex(element.backgroundColor) };
      }
      pptSlide.addText(element.content || '', opts);
      break;
    }

    case 'shape': {
      const shapeType = element.shapeType === 'circle'
        ? pptx.ShapeType.ellipse
        : element.shapeType === 'line'
          ? pptx.ShapeType.line
          : pptx.ShapeType.rect;

      const shapeOpts: Record<string, any> = {
        x, y, w, h, rotate,
        fill: { color: toHex(element.backgroundColor || '#3b82f6') },
      };

      // Outlined / border shape
      if (element.border) {
        shapeOpts.line = {
          pt: Math.round(element.border.width * 0.75),
          color: toHex(element.border.color),
          dashType: element.border.style === 'dashed' ? 'dash' : element.border.style === 'dotted' ? 'dot' : 'solid',
        };
        // If fill is transparent treat as outline-only
        if (!element.backgroundColor || element.backgroundColor === 'transparent') {
          shapeOpts.fill = { type: 'none' };
        }
      }

      // Rounded rect
      if (element.borderRadius && element.shapeType !== 'circle') {
        shapeOpts.rectRadius = element.borderRadius / 100; // pptxgenjs uses 0-1 ratio
      }

      pptSlide.addShape(shapeType, shapeOpts);
      break;
    }

    case 'image': {
      if (element.imageUrl) {
        try {
          const imgOpts: Record<string, any> = { data: element.imageUrl, x, y, w, h, rotate };
          if (element.imageRotation) imgOpts.rotate = (imgOpts.rotate || 0) + element.imageRotation;
          pptSlide.addImage(imgOpts);
        } catch (e) {
          console.warn('Failed to add image to PPTX:', e);
        }
      }
      break;
    }

    case 'table': {
      if (element.tableConfig) {
        const cfg = element.tableConfig;
        const tableData = cfg.cells.map((row, rowIndex) =>
          row.map(cell => ({
            text: cell.content || '',
            options: {
              bold: rowIndex === 0 && cfg.headerRow ? true : cell.fontWeight === 'bold',
              color: cell.textColor ? toHex(cell.textColor) : undefined,
              align: cell.textAlign || 'left',
              fill: rowIndex === 0 && cfg.headerRow
                ? { color: toHex(cfg.headerBgColor || 'f3f4f6') }
                : rowIndex % 2 === 1 && cfg.alternateRowColors
                  ? { color: toHex(cfg.alternateColor || 'f9fafb') }
                  : undefined,
            },
          }))
        );
        pptSlide.addTable(tableData, {
          x, y, w, h,
          fontSize: 10,
          border: { pt: cfg.borderWidth || 1, color: toHex(cfg.borderColor || '#e5e7eb') },
          colW: Array(cfg.cols).fill(w / cfg.cols),
        });
      }
      break;
    }

    case 'code': {
      if (element.codeConfig) {
        pptSlide.addText(element.codeConfig.code || '', {
          x, y, w, h, rotate,
          fontSize: Math.round((element.codeConfig.fontSize || 14) * 0.75),
          fontFace: 'Courier New',
          color: 'D4D4D4',
          fill: { color: '1E1E1E' },
        });
      }
      break;
    }

    case 'icon': {
      if (element.iconConfig) {
        const { name, color, size, strokeWidth, backgroundColor: iconBg, backgroundRadius, customImageUrl } = element.iconConfig;
        const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
        const IconComponent = icons[name];

        if (customImageUrl) {
          try {
            pptSlide.addImage({ data: customImageUrl, x, y, w, h, rotate });
          } catch (e) { /* ignore */ }
          break;
        }

        if (IconComponent) {
          try {
            const canvasSize = size * 4;
            const padding = iconBg ? Math.round(canvasSize * 0.15) : 0;
            const cvs = document.createElement('canvas');
            cvs.width  = canvasSize + padding * 2;
            cvs.height = canvasSize + padding * 2;
            const ctx = cvs.getContext('2d')!;

            if (iconBg) {
              ctx.fillStyle = iconBg;
              const r = Math.min((backgroundRadius || 0) * (cvs.width / size), cvs.width / 2);
              ctx.beginPath();
              ctx.roundRect(0, 0, cvs.width, cvs.height, r);
              ctx.fill();
            }

            const svgStr = renderToStaticMarkup(
              createElement(IconComponent, { width: canvasSize, height: canvasSize, color, strokeWidth })
            );
            const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            await new Promise<void>(resolve => {
              const img = new Image();
              img.onload = () => { ctx.drawImage(img, padding, padding); URL.revokeObjectURL(url); resolve(); };
              img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
              img.src = url;
            });

            pptSlide.addImage({ data: cvs.toDataURL('image/png'), x, y, w, h, rotate });
          } catch (e) {
            console.warn('Icon render failed:', name, e);
            pptSlide.addShape(pptx.ShapeType.ellipse, { x, y, w, h, fill: { color: toHex(iconBg || color || '#3b82f6') } });
          }
        }
      }
      break;
    }

    case 'chart': {
      if (element.chartConfig) {
        const chartData = element.chartConfig.data || [];
        if (chartData.length > 0) {
          const tableData = [
            [{ text: 'Name', options: { bold: true } }, { text: 'Value', options: { bold: true } }],
            ...chartData.map(item => [{ text: item.name || '', options: {} }, { text: String(item.value || 0), options: {} }]),
          ];
          pptSlide.addTable(tableData, { x, y, w, h, fontSize: 10, border: { pt: 1, color: '000000' } });
        }
      }
      break;
    }

    case 'video':
    case 'audio': {
      pptSlide.addText(`[${element.type.toUpperCase()}]`, {
        x, y, w, h, fontSize: 14, color: '666666', align: 'center', valign: 'middle',
        fill: { color: 'F0F0F0' },
      });
      break;
    }
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
export const exportToPdf = async (slides: SlideTemplate[], title: string, canvasWidth = 960, canvasHeight = 540) => {
  const exportWidth = EXPORT_WIDTH;
  const exportHeight = Math.round((exportWidth * canvasHeight) / canvasWidth);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [exportWidth, exportHeight] });

  for (let i = 0; i < slides.length; i++) {
    const slideHtml = await renderSlideToHtml(slides[i], i, canvasWidth, canvasHeight);
    
    if (i > 0) pdf.addPage([exportWidth, exportHeight], 'landscape');

    try {
      const canvas = await html2canvas(slideHtml, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: exportWidth,
        height: exportHeight,
        backgroundColor: slides[i].backgroundColor,
        logging: false,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });
      // Use JPEG with 0.9 quality for smaller file size
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, exportWidth, exportHeight);
    } catch (e) {
      console.error('Error rendering slide', i, e);
    }
    slideHtml.remove();
  }

  pdf.save(`${title}.pdf`);
};

// Export ALL slides to images
export const exportToImages = async (slides: SlideTemplate[], title: string, canvasWidth = 960, canvasHeight = 540) => {
  const exportWidth = EXPORT_WIDTH;
  const exportHeight = Math.round((exportWidth * canvasHeight) / canvasWidth);
  for (let i = 0; i < slides.length; i++) {
    const slideHtml = await renderSlideToHtml(slides[i], i, canvasWidth, canvasHeight);

    try {
      const canvas = await html2canvas(slideHtml, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: exportWidth,
        height: exportHeight,
        backgroundColor: slides[i].backgroundColor,
        logging: false,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
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


const renderSlideToHtml = async (slide: SlideTemplate, index: number, canvasWidth = 960, canvasHeight = 540): Promise<HTMLDivElement> => {
  const exportWidth = EXPORT_WIDTH;
  const exportHeight = Math.round((exportWidth * canvasHeight) / canvasWidth);
  const scale = exportWidth / canvasWidth;
  const container = document.createElement('div');
  container.id = `export-slide-${index}`;

  // Build background – html2canvas doesn't support CSS gradients on background-image,
  // so we render a gradient as an absolutely-positioned child div instead.
  const isGradient = slide.backgroundColor.includes('gradient');
  container.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    width: ${exportWidth}px; height: ${exportHeight}px;
    background: ${isGradient ? 'transparent' : slide.backgroundColor};
    color: ${slide.textColor};
    font-family: system-ui, -apple-system, sans-serif;
    overflow: hidden; box-sizing: border-box;
  `;

  // Gradient background rendered as a real child so html2canvas picks it up
  if (isGradient) {
    const gradientLayer = document.createElement('div');
    gradientLayer.style.cssText = `
      position: absolute; inset: 0;
      background: ${slide.backgroundColor};
      z-index: 0;
    `;
    container.appendChild(gradientLayer);
  }

  if (slide.elements && slide.elements.length > 0) {
    // Sort by zIndex so stacking is correct
    const sorted = [...slide.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const element of sorted) {
      container.appendChild(renderElementToHtml(element, slide, scale));
    }
  } else {
    container.appendChild(renderDefaultContentToHtml(slide));
  }

  document.body.appendChild(container);
  // Give images / web-fonts time to load
  await new Promise(r => setTimeout(r, 300));
  void container.offsetHeight; // force layout
  return container;
};

const renderElementToHtml = (element: SlideElement, slide: SlideTemplate, scale: number): HTMLElement => {
  const el = document.createElement('div');

  const scaledX      = element.x      * scale;
  const scaledY      = element.y      * scale;
  const scaledWidth  = element.width  * scale;
  const scaledHeight = element.height * scale;
  const opacity      = element.opacity ?? 1;
  const zIndex       = element.zIndex ?? 1;

  // Build transform string (rotation + flip for images)
  let transform = '';
  if (element.rotation) transform += `rotate(${element.rotation}deg) `;

  // Box-shadow from ShadowConfig
  let boxShadow = 'none';
  if (element.shadow?.enabled) {
    const s = element.shadow;
    const inset = s.inset ? 'inset ' : '';
    boxShadow = `${inset}${s.x * scale}px ${s.y * scale}px ${s.blur * scale}px ${s.spread * scale}px ${s.color}`;
  }

  // CSS filters
  let filter = '';
  if (element.filters) {
    const f = element.filters;
    filter = [
      f.blur       ? `blur(${f.blur * scale}px)`            : '',
      f.brightness !== undefined && f.brightness !== 100 ? `brightness(${f.brightness}%)` : '',
      f.contrast   !== undefined && f.contrast   !== 100 ? `contrast(${f.contrast}%)`     : '',
      f.saturation !== undefined && f.saturation !== 100 ? `saturate(${f.saturation}%)`   : '',
      f.hueRotate  ? `hue-rotate(${f.hueRotate}deg)`        : '',
      f.grayscale  ? `grayscale(${f.grayscale}%)`           : '',
      f.sepia      ? `sepia(${f.sepia}%)`                   : '',
      f.invert     ? `invert(${f.invert}%)`                 : '',
    ].filter(Boolean).join(' ');
  }

  el.style.cssText = `
    position: absolute;
    left: ${scaledX}px; top: ${scaledY}px;
    width: ${scaledWidth}px; height: ${scaledHeight}px;
    opacity: ${opacity};
    z-index: ${zIndex};
    box-sizing: border-box;
    ${transform    ? `transform: ${transform.trim()};`        : ''}
    ${transform    ? 'transform-origin: center center;'       : ''}
    ${boxShadow !== 'none' ? `box-shadow: ${boxShadow};`      : ''}
    ${filter       ? `filter: ${filter};`                     : ''}
  `;

  switch (element.type) {
    case 'text': {
      const scaledFontSize   = (element.fontSize   || 16)  * scale;
      const scaledLetterSpacing = (element.letterSpacing || 0) * scale;
      const scaledPadding    = 8 * scale;

      const bgValue = element.backgroundColor || '';
      const hasBg   = bgValue && bgValue !== 'transparent';

      el.style.cssText += `
        font-size: ${scaledFontSize}px;
        font-weight: ${element.fontWeight || 'normal'};
        font-style: ${element.fontStyle || 'normal'};
        text-align: ${element.textAlign || 'left'};
        color: ${element.color || slide.textColor};
        font-family: ${element.fontFamily || 'inherit'};
        line-height: ${element.lineHeight || 1.5};
        letter-spacing: ${scaledLetterSpacing}px;
        text-decoration: ${element.textDecoration || 'none'};
        text-transform: ${element.textTransform || 'none'};
        ${element.textShadow ? `text-shadow: ${element.textShadow};` : ''}
        ${hasBg ? `background: ${bgValue};` : ''}
        display: flex;
        flex-direction: column;
        padding: ${scaledPadding}px;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow: visible;
        align-items: ${element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'};
        justify-content: ${element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'};
      `;
      if (element.border) {
        el.style.border = `${element.border.width * scale}px ${element.border.style} ${element.border.color}`;
      }
      if (element.borderRadius) {
        el.style.borderRadius = `${element.borderRadius * scale}px`;
      }
      const span = document.createElement('span');
      span.style.cssText = 'display: block; width: 100%;';
      span.textContent = element.content || '';
      el.appendChild(span);
      break;
    }

    case 'shape': {
      const scaledBorderRadius = (element.borderRadius || 0) * scale;
      const bgColor = element.backgroundColor || '#3b82f6';
      const isGradientBg = bgColor.includes('gradient');

      el.style.cssText += `
        ${isGradientBg ? `background: ${bgColor};` : `background-color: ${bgColor};`}
        border-radius: ${element.shapeType === 'circle' ? '50%' : scaledBorderRadius + 'px'};
      `;

      if (element.border) {
        el.style.border = `${element.border.width * scale}px ${element.border.style} ${element.border.color}`;
        // If it's an outlined shape (transparent fill), override bg
        if (bgColor === 'transparent') el.style.background = 'transparent';
      }

      // Arrow shape as inline SVG
      if (element.shapeType === 'arrow') {
        el.style.background = 'transparent';
        el.innerHTML = `<svg viewBox="0 0 100 50" style="width:100%;height:100%;"><polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill="${bgColor}"/></svg>`;
      }
      break;
    }

    case 'image': {
      if (element.imageUrl) {
        const img = document.createElement('img');
        img.src = element.imageUrl;
        img.crossOrigin = 'anonymous';

        let imgTransform = '';
        if (element.imageRotation) imgTransform += `rotate(${element.imageRotation}deg) `;
        if (element.flipHorizontal) imgTransform += 'scaleX(-1) ';
        if (element.flipVertical)   imgTransform += 'scaleY(-1) ';

        img.style.cssText = `
          width: 100%; height: 100%;
          object-fit: ${element.objectFit || 'cover'};
          object-position: ${element.objectPosition || 'center center'};
          border-radius: ${(element.borderRadius || 0) * scale}px;
          ${imgTransform ? `transform: ${imgTransform.trim()}; transform-origin: center center;` : ''}
          ${element.clipPath ? `clip-path: ${element.clipPath};` : ''}
        `;
        el.appendChild(img);
      }
      break;
    }

    case 'table': {
      if (element.tableConfig) {
        const cfg = element.tableConfig;
        const table = document.createElement('table');
        table.style.cssText = `
          width: 100%; height: 100%;
          border-collapse: collapse;
          font-size: ${14 * scale}px;
          table-layout: fixed;
        `;
        cfg.cells.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          row.forEach((cell) => {
            const isHeader = rowIndex === 0 && cfg.headerRow;
            const td = document.createElement(isHeader ? 'th' : 'td');
            td.textContent = cell.content || '';

            const cellBg = isHeader
              ? (cfg.headerBgColor || (rowIndex % 2 === 1 && cfg.alternateRowColors ? cfg.alternateColor || '' : ''))
              : (rowIndex % 2 === 1 && cfg.alternateRowColors ? cfg.alternateColor || '' : '');

            td.style.cssText = `
              border: ${cfg.borderWidth || 1}px solid ${cfg.borderColor || '#e5e7eb'};
              padding: ${(cfg.cellPadding || 8) * scale}px;
              text-align: ${cell.textAlign || 'left'};
              font-weight: ${(isHeader || cell.fontWeight === 'bold') ? 'bold' : 'normal'};
              color: ${cell.textColor || (isHeader ? cfg.headerTextColor || '' : '')};
              ${cellBg ? `background-color: ${cellBg};` : ''}
            `;
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
        el.appendChild(table);
      }
      break;
    }

    case 'code': {
      if (element.codeConfig) {
        el.style.cssText += `
          background-color: #1e1e1e; color: #d4d4d4;
          font-family: 'Courier New', monospace;
          font-size: ${(element.codeConfig.fontSize || 14) * scale}px;
          padding: ${16 * scale}px;
          border-radius: ${8 * scale}px;
          white-space: pre; overflow: hidden;
        `;
        el.textContent = element.codeConfig.code || '';
      }
      break;
    }

    case 'icon': {
      if (element.iconConfig) {
        const { name, color, size, strokeWidth, backgroundColor: iconBg, backgroundRadius, rotation: iconRot, customImageUrl } = element.iconConfig;
        const scaledSize = size * scale;
        const scaledPad  = iconBg ? 12 * scale : 0;
        const scaledBgR  = (backgroundRadius || 0) * scale;

        el.style.cssText += `
          display: flex; align-items: center; justify-content: center;
          ${iconRot ? `transform: rotate(${iconRot}deg); transform-origin: center center;` : ''}
        `;

        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
          display: flex; align-items: center; justify-content: center;
          background-color: ${iconBg || 'transparent'};
          border-radius: ${scaledBgR}px;
          padding: ${scaledPad}px;
        `;

        if (customImageUrl) {
          const img = document.createElement('img');
          img.src = customImageUrl;
          img.style.cssText = `width: ${scaledSize}px; height: ${scaledSize}px; object-fit: contain;`;
          iconContainer.appendChild(img);
        } else {
          const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
          const IconComponent = icons[name];
          if (IconComponent) {
            try {
              const svgString = renderToStaticMarkup(
                createElement(IconComponent, { width: scaledSize, height: scaledSize, color, strokeWidth })
              );
              iconContainer.innerHTML = svgString;
            } catch (e) {
              console.warn('Failed to render icon:', name, e);
            }
          }
        }
        el.appendChild(iconContainer);
      }
      break;
    }

    case 'chart': {
      if (element.chartConfig) {
        const chartData = element.chartConfig.data || [];
        const chartType = element.chartConfig.type || 'bar';
        const colors    = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];

        el.style.cssText += `
          display: flex; flex-direction: column;
          padding: ${16 * scale}px;
          background: #f8f9fa;
          border-radius: ${8 * scale}px;
        `;

        if (chartType === 'pie') {
          const total = chartData.reduce((s, d) => s + (d.value || 0), 0);
          const parts: string[] = [];
          let angle = 0;
          chartData.forEach((item, i) => {
            const pct = total > 0 ? (item.value / total) * 360 : 0;
            const clr = item.color || colors[i % colors.length];
            parts.push(`${clr} ${angle}deg ${angle + pct}deg`);
            angle += pct;
          });
          const pieSize = Math.min(scaledWidth, scaledHeight) * 0.7;
          const pie = document.createElement('div');
          pie.style.cssText = `
            width: ${pieSize}px; height: ${pieSize}px;
            border-radius: 50%; margin: auto;
            background: conic-gradient(${parts.join(', ')});
          `;
          el.appendChild(pie);
        } else {
          const maxVal = Math.max(...chartData.map(d => d.value || 0), 1);
          const barWrap = document.createElement('div');
          barWrap.style.cssText = `
            display: flex; align-items: flex-end; justify-content: space-around;
            height: 80%; width: 100%; padding-top: ${16 * scale}px;
          `;
          chartData.forEach((item, i) => {
            const barH   = ((item.value || 0) / maxVal) * 100;
            const clr    = item.color || colors[i % colors.length];
            const bw     = document.createElement('div');
            bw.style.cssText = `display:flex;flex-direction:column;align-items:center;flex:1;height:100%;`;
            bw.innerHTML = `
              <div style="flex:1;display:flex;align-items:flex-end;width:100%;justify-content:center;">
                <div style="width:60%;height:${barH}%;background:${clr};border-radius:${4*scale}px ${4*scale}px 0 0;"></div>
              </div>
              <div style="font-size:${12*scale}px;margin-top:${8*scale}px;text-align:center;color:#333;">${item.name||''}</div>
            `;
            barWrap.appendChild(bw);
          });
          el.appendChild(barWrap);
        }
      }
      break;
    }

    case 'video':
    case 'audio':
      el.style.cssText += `
        display: flex; align-items: center; justify-content: center;
        background: #f0f0f0; border-radius: ${8 * scale}px;
        font-size: ${24 * scale}px; color: #666;
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
