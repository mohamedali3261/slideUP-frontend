export interface TableCell {
  content: string;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
}

export interface TableConfig {
  rows: number;
  cols: number;
  cells: TableCell[][];
  headerRow: boolean;
  headerCol: boolean;
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
  alternateRowColors?: boolean;
  alternateColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
}

export interface CodeConfig {
  code: string;
  language: string;
  theme: 'dark' | 'light' | 'monokai' | 'github' | 'dracula' | 'nord';
  showLineNumbers: boolean;
  fontSize: number;
  highlightLines?: number[];
  showHeader?: boolean;
  headerTitle?: string;
  wrapLines?: boolean;
  tabSize?: number;
}

export interface BorderConfig {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowConfig {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

export interface FiltersConfig {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'video' | 'audio' | 'icon' | 'table' | 'code';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'light' | 'medium' | 'semibold' | 'extrabold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  textShadow?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  imageUrl?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  imageRotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  clipPath?: string;
  maskImage?: string;
  shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow';
  chartConfig?: {
    type: 'bar' | 'line' | 'pie';
    data: { name: string; value: number; color?: string }[];
  };
  mediaConfig?: {
    type: 'video' | 'audio' | 'gif' | 'youtube';
    src: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
  iconConfig?: {
    name: string;
    color: string;
    size: number;
    strokeWidth: number;
    backgroundColor?: string;
    backgroundRadius?: number;
    rotation?: number;
    customImageUrl?: string;
  };
  tableConfig?: TableConfig;
  codeConfig?: CodeConfig;
  animation?: {
    type: string;
    duration: number;
    delay: number;
    easing: string;
    repeat?: number;
    direction?: string;
    fillMode?: string;
    playState?: string;
    stagger?: number;
    intensity?: number;
  };
  zIndex?: number;
  groupId?: string;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
  rotation?: number; // Rotation angle in degrees
  border?: BorderConfig;
  shadow?: ShadowConfig;
  filters?: FiltersConfig;
  animationOrder?: number; // Order in which animations play (lower = first)
}

export interface SlideTemplate {
  id: string;
  type: 'cover' | 'content' | 'chart' | 'image' | 'thankyou' | 'section' | 'comparison' | 'timeline' | 'quote' | 'team' | 'agenda' | 'blank' | 'features' | 'pricing' | 'stats' | 'process' | 'gallery' | 'contact';
  title: string;
  subtitle?: string;
  content?: string[];
  backgroundColor: string;
  textColor: string;
  imageUrl?: string;
  elements?: SlideElement[];
  comparisonData?: { leftTitle: string; rightTitle: string; leftItems: string[]; rightItems: string[] };
  timelineData?: { year: string; title: string; description: string }[];
  teamData?: { name: string; role: string; image?: string }[];
  statsData?: { value: string; label: string }[];
  pricingData?: { name: string; price: string; features: string[]; highlighted?: boolean }[];
  processData?: { step: string; title: string; description: string }[];
  featuresData?: { icon: string; title: string; description: string }[];
  galleryData?: { image: string; caption?: string }[];
  contactData?: { email?: string; phone?: string; address?: string; social?: { platform: string; url: string }[] };
}

export interface PresentationTemplate {
  id: string;
  titleKey: string;
  categoryKey: string;
  slideCount: number;
  image: string;
  slides: SlideTemplate[];
  description?: string;
  descriptionEn?: string;
  tags?: string[];
  isNew?: boolean;
}

// Import all templates
import { dataAnalyticsTemplate } from './templates/data-analytics';
import { medicalHealthcareTemplate } from './templates/medical-healthcare';
import { corporateReportTemplate } from './templates/corporate-report';
import { onlineCourseTemplate } from './templates/online-course';
import { ecommerceTemplate } from './templates/ecommerce-launch';
import { realEstateTemplate } from './templates/real-estate';
import { eventConferenceTemplate } from './templates/event-conference';
import { restaurantFoodTemplate } from './templates/restaurant-food';
import { aiIntelligenceTemplate } from './templates/ai-intelligence';
import { financeReportTemplate } from './templates/finance-report';
import { sportsEnergyTemplate } from './templates/sports-energy';
import { architecturePortfolioTemplate } from './templates/architecture-portfolio';
import { travelAdventureTemplate } from './templates/travel-adventure';
import { arabicBusinessTemplate } from './templates/arabic-business';
import { arabicEducationTemplate } from './templates/arabic-education';
import { arabicRestaurantTemplate } from './templates/arabic-restaurant';
import { arabicEventTemplate } from './templates/arabic-event';
import { arabicMarketingTemplate } from './templates/arabic-marketing';
import { techTrendsTemplate } from './templates/tech-trends';

export const templates: PresentationTemplate[] = [
  dataAnalyticsTemplate,
  medicalHealthcareTemplate,
  corporateReportTemplate,
  onlineCourseTemplate,
  ecommerceTemplate,
  realEstateTemplate,
  eventConferenceTemplate,
  restaurantFoodTemplate,
  aiIntelligenceTemplate,
  financeReportTemplate,
  sportsEnergyTemplate,
  architecturePortfolioTemplate,
  travelAdventureTemplate,
  arabicBusinessTemplate,
  arabicEducationTemplate,
  arabicRestaurantTemplate,
  arabicEventTemplate,
  arabicMarketingTemplate,
  techTrendsTemplate,
];

export const getTemplateById = (id: string): PresentationTemplate | undefined => {
  return templates.find(t => t.id === id);
};
