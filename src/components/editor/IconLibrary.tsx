import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Search,
  Smile,
  Trash2,
  ImagePlus,
  // Business & Work
  Briefcase, Building, Building2, Calculator, Calendar, Clock, CreditCard,
  DollarSign, FileText, Folder, Globe, Mail, Phone, Printer, Users,
  Handshake, PiggyBank, Wallet, Banknote, TrendingUp as ChartUp, BarChart3,
  Presentation, Projector, Megaphone, Target as Bullseye, Rocket,
  Contact, Landmark, Scale, Gavel, ScrollText,
  // Arrows & Navigation
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, MoveUp, MoveDown, CornerUpRight, CornerDownLeft,
  ArrowUpRight, ArrowDownLeft, ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, MoveHorizontal, MoveVertical,
  ArrowUpCircle, ArrowDownCircle, ArrowLeftCircle, ArrowRightCircle,
  // Media & Communication
  Camera, Film, Image, Mic, Music, Play, Pause, Video, Volume2, VolumeX,
  Radio, Tv, Headphones, Speaker, Podcast, Disc, Disc3, Clapperboard,
  FastForward, Rewind, SkipForward, SkipBack, Repeat, Shuffle,
  Airplay, Cast, Voicemail, PhoneCall, PhoneIncoming, PhoneOutgoing,
  // Technology
  Laptop, Monitor, Smartphone, Tablet, Cpu, Database, HardDrive, Server,
  Wifi, Bluetooth, Cloud, CloudUpload, CloudDownload, Code, Terminal,
  Binary, Bug, Boxes, Braces, Brackets, GitBranch, GitCommit, GitMerge,
  Usb, Battery, BatteryCharging, Power, PowerOff, Plug, Unplug,
  Keyboard, Mouse, Printer as PrinterIcon, Router, Signal, Rss,
  // Social & People
  User, UserPlus, UserMinus, UserCheck, Heart, ThumbsUp, ThumbsDown,
  MessageCircle, MessageSquare, Share2, Send, AtSign,
  Users2, UserCircle, UserCog, UsersRound, Baby, PersonStanding,
  Smile as SmileIcon, Frown, Meh, Laugh, PartyPopper,
  Handshake as HandshakeIcon, UserX, UserCheck2, Users as UsersIcon,
  // Nature & Weather
  Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella, Leaf, Flower2,
  TreeDeciduous, Mountain, Waves, Sunrise, Sunset, CloudFog, CloudDrizzle,
  Snowflake, Droplet, Droplets, Rainbow, Cloudy, CloudLightning,
  Sprout, Trees, Bug as BugIcon, Bird, Fish as FishIcon,
  // Shopping & Commerce
  ShoppingCart, ShoppingBag, Package, Gift, Tag, Percent, Receipt,
  Store, Truck, CreditCard as Card, Coins, BadgeDollarSign, BadgePercent,
  Barcode, QrCode as QrCodeIcon, Scan as ScanIcon, PackageCheck, PackageX,
  // Education & Science
  BookOpen, GraduationCap, Library, Microscope, Atom, FlaskConical,
  Lightbulb, Brain, Target, Award, Trophy, Medal, Beaker, TestTube,
  Dna, Telescope, Glasses, BookMarked, Notebook, PenTool, Pencil,
  Ruler, Eraser, Highlighter, Palette, Paintbrush,
  // Health & Medical
  Activity, Heart as HeartPulse, Pill, Stethoscope, Thermometer,
  Syringe, Cross, Ambulance, Hospital, Accessibility,
  HeartHandshake, Dumbbell, Apple as AppleIcon, Salad as SaladIcon,
  // Food & Drink
  Coffee, UtensilsCrossed, Wine, Pizza, Apple, Cake, Soup, Salad,
  IceCream, Sandwich, Cookie, Croissant, Egg, Fish, Beef, Carrot,
  Cherry, Grape, Milk, Beer, CupSoda,
  // Travel & Transport
  Plane, Car, Bus, Train, Ship, Bike, MapPin, Map, Compass, Navigation,
  Hotel, Luggage, Palmtree, Tent, Anchor, Sailboat, Fuel, PlaneTakeoff, PlaneLanding,
  Rocket as RocketIcon, Castle,
  // Tools & Settings
  Settings, Wrench, Hammer, Scissors, Key, Lock, Unlock, Shield,
  Cog, SlidersHorizontal, Filter, Search as SearchIcon, Scan, QrCode,
  Drill, Axe, Shovel, Pickaxe, Flashlight,
  // Shapes & Symbols
  Circle, Square, Triangle, Star, Hexagon, Octagon, Pentagon,
  Plus, Minus, X, Check, AlertCircle, AlertTriangle, Info, HelpCircle,
  Diamond, Spade, Club, Heart as HeartShape, Infinity, Hash, Asterisk,
  Percent as PercentIcon, Equal, Slash,
  // Charts & Data
  BarChart, BarChart2, PieChart, TrendingUp, TrendingDown, Activity as LineChart,
  BarChart4, LineChart as ChartLine, AreaChart, CandlestickChart,
  // Files & Documents
  File, FileText as Document, FilePlus, FileCheck, FolderOpen, Archive, Clipboard,
  Files, FolderPlus, FolderMinus, FileEdit, FileSpreadsheet, FileImage, FileVideo,
  FileAudio, FileCode, FileCog, FileJson, FileLock, FileSearch,
  // Misc
  Zap, Flame, Sparkles, Crown, Flag, Bookmark, Bell, Eye, EyeOff,
  Link, ExternalLink, Download, Upload, RefreshCw, RotateCw, Maximize, Minimize,
  Home, Inbox, Layers, Layout, Grid, List, Menu, MoreHorizontal, MoreVertical,
  Pin, Paperclip, Stamp, Timer, Hourglass, Watch, AlarmClock, CalendarDays,
  Gauge, Thermometer as ThermometerIcon, Wifi as WifiIcon, WifiOff, Volume, VolumeX as VolumeOff,
  Smile as SmileEmoji, Angry, Annoyed, Frown as FrownEmoji,
} from 'lucide-react';

// Icon categories with their icons
const ICON_CATEGORIES = {
  business: {
    label: 'Business',
    labelAr: 'الأعمال',
    icons: [
      { name: 'Briefcase', icon: Briefcase },
      { name: 'Building', icon: Building },
      { name: 'Building2', icon: Building2 },
      { name: 'Calculator', icon: Calculator },
      { name: 'Calendar', icon: Calendar },
      { name: 'Clock', icon: Clock },
      { name: 'CreditCard', icon: CreditCard },
      { name: 'DollarSign', icon: DollarSign },
      { name: 'FileText', icon: FileText },
      { name: 'Folder', icon: Folder },
      { name: 'Globe', icon: Globe },
      { name: 'Mail', icon: Mail },
      { name: 'Phone', icon: Phone },
      { name: 'Printer', icon: Printer },
      { name: 'Users', icon: Users },
      { name: 'Handshake', icon: Handshake },
      { name: 'PiggyBank', icon: PiggyBank },
      { name: 'Wallet', icon: Wallet },
      { name: 'Banknote', icon: Banknote },
      { name: 'ChartUp', icon: ChartUp },
      { name: 'BarChart3', icon: BarChart3 },
      { name: 'Presentation', icon: Presentation },
      { name: 'Projector', icon: Projector },
      { name: 'Megaphone', icon: Megaphone },
      { name: 'Bullseye', icon: Bullseye },
      { name: 'Rocket', icon: Rocket },
      { name: 'Contact', icon: Contact },
      { name: 'Landmark', icon: Landmark },
      { name: 'Scale', icon: Scale },
      { name: 'Gavel', icon: Gavel },
      { name: 'ScrollText', icon: ScrollText },
    ],
  },
  arrows: {
    label: 'Arrows',
    labelAr: 'الأسهم',
    icons: [
      { name: 'ArrowUp', icon: ArrowUp },
      { name: 'ArrowDown', icon: ArrowDown },
      { name: 'ArrowLeft', icon: ArrowLeft },
      { name: 'ArrowRight', icon: ArrowRight },
      { name: 'ChevronUp', icon: ChevronUp },
      { name: 'ChevronDown', icon: ChevronDown },
      { name: 'ChevronLeft', icon: ChevronLeft },
      { name: 'ChevronRight', icon: ChevronRight },
      { name: 'MoveUp', icon: MoveUp },
      { name: 'MoveDown', icon: MoveDown },
      { name: 'CornerUpRight', icon: CornerUpRight },
      { name: 'CornerDownLeft', icon: CornerDownLeft },
      { name: 'ArrowUpRight', icon: ArrowUpRight },
      { name: 'ArrowDownLeft', icon: ArrowDownLeft },
      { name: 'ArrowBigUp', icon: ArrowBigUp },
      { name: 'ArrowBigDown', icon: ArrowBigDown },
      { name: 'ArrowBigLeft', icon: ArrowBigLeft },
      { name: 'ArrowBigRight', icon: ArrowBigRight },
      { name: 'ChevronsUp', icon: ChevronsUp },
      { name: 'ChevronsDown', icon: ChevronsDown },
      { name: 'ChevronsLeft', icon: ChevronsLeft },
      { name: 'ChevronsRight', icon: ChevronsRight },
      { name: 'MoveHorizontal', icon: MoveHorizontal },
      { name: 'MoveVertical', icon: MoveVertical },
    ],
  },
  media: {
    label: 'Media',
    labelAr: 'الوسائط',
    icons: [
      { name: 'Camera', icon: Camera },
      { name: 'Film', icon: Film },
      { name: 'Image', icon: Image },
      { name: 'Mic', icon: Mic },
      { name: 'Music', icon: Music },
      { name: 'Play', icon: Play },
      { name: 'Pause', icon: Pause },
      { name: 'Video', icon: Video },
      { name: 'Volume2', icon: Volume2 },
      { name: 'VolumeX', icon: VolumeX },
      { name: 'Radio', icon: Radio },
      { name: 'Tv', icon: Tv },
      { name: 'Headphones', icon: Headphones },
      { name: 'Speaker', icon: Speaker },
      { name: 'Podcast', icon: Podcast },
      { name: 'Disc', icon: Disc },
      { name: 'Disc3', icon: Disc3 },
      { name: 'Clapperboard', icon: Clapperboard },
      { name: 'FastForward', icon: FastForward },
      { name: 'Rewind', icon: Rewind },
      { name: 'SkipForward', icon: SkipForward },
      { name: 'SkipBack', icon: SkipBack },
      { name: 'Repeat', icon: Repeat },
      { name: 'Shuffle', icon: Shuffle },
    ],
  },
  technology: {
    label: 'Technology',
    labelAr: 'التكنولوجيا',
    icons: [
      { name: 'Laptop', icon: Laptop },
      { name: 'Monitor', icon: Monitor },
      { name: 'Smartphone', icon: Smartphone },
      { name: 'Tablet', icon: Tablet },
      { name: 'Cpu', icon: Cpu },
      { name: 'Database', icon: Database },
      { name: 'HardDrive', icon: HardDrive },
      { name: 'Server', icon: Server },
      { name: 'Wifi', icon: Wifi },
      { name: 'Bluetooth', icon: Bluetooth },
      { name: 'Cloud', icon: Cloud },
      { name: 'CloudUpload', icon: CloudUpload },
      { name: 'CloudDownload', icon: CloudDownload },
      { name: 'Code', icon: Code },
      { name: 'Terminal', icon: Terminal },
      { name: 'Binary', icon: Binary },
      { name: 'Bug', icon: Bug },
      { name: 'Boxes', icon: Boxes },
      { name: 'Braces', icon: Braces },
      { name: 'Brackets', icon: Brackets },
      { name: 'GitBranch', icon: GitBranch },
      { name: 'GitCommit', icon: GitCommit },
      { name: 'GitMerge', icon: GitMerge },
      { name: 'Usb', icon: Usb },
      { name: 'Battery', icon: Battery },
      { name: 'BatteryCharging', icon: BatteryCharging },
      { name: 'Power', icon: Power },
      { name: 'PowerOff', icon: PowerOff },
      { name: 'Plug', icon: Plug },
      { name: 'Unplug', icon: Unplug },
    ],
  },
  social: {
    label: 'Social',
    labelAr: 'اجتماعي',
    icons: [
      { name: 'User', icon: User },
      { name: 'UserPlus', icon: UserPlus },
      { name: 'UserMinus', icon: UserMinus },
      { name: 'UserCheck', icon: UserCheck },
      { name: 'Heart', icon: Heart },
      { name: 'ThumbsUp', icon: ThumbsUp },
      { name: 'ThumbsDown', icon: ThumbsDown },
      { name: 'MessageCircle', icon: MessageCircle },
      { name: 'MessageSquare', icon: MessageSquare },
      { name: 'Share2', icon: Share2 },
      { name: 'Send', icon: Send },
      { name: 'AtSign', icon: AtSign },
      { name: 'Users2', icon: Users2 },
      { name: 'UserCircle', icon: UserCircle },
      { name: 'UserCog', icon: UserCog },
      { name: 'UsersRound', icon: UsersRound },
      { name: 'Baby', icon: Baby },
      { name: 'PersonStanding', icon: PersonStanding },
      { name: 'SmileIcon', icon: SmileIcon },
      { name: 'Frown', icon: Frown },
      { name: 'Meh', icon: Meh },
      { name: 'Laugh', icon: Laugh },
      { name: 'PartyPopper', icon: PartyPopper },
    ],
  },
  nature: {
    label: 'Nature',
    labelAr: 'الطبيعة',
    icons: [
      { name: 'Sun', icon: Sun },
      { name: 'Moon', icon: Moon },
      { name: 'CloudRain', icon: CloudRain },
      { name: 'CloudSnow', icon: CloudSnow },
      { name: 'Wind', icon: Wind },
      { name: 'Umbrella', icon: Umbrella },
      { name: 'Leaf', icon: Leaf },
      { name: 'Flower2', icon: Flower2 },
      { name: 'TreeDeciduous', icon: TreeDeciduous },
      { name: 'Mountain', icon: Mountain },
      { name: 'Waves', icon: Waves },
      { name: 'Sunrise', icon: Sunrise },
      { name: 'Sunset', icon: Sunset },
      { name: 'CloudFog', icon: CloudFog },
      { name: 'CloudDrizzle', icon: CloudDrizzle },
      { name: 'Snowflake', icon: Snowflake },
      { name: 'Droplet', icon: Droplet },
      { name: 'Droplets', icon: Droplets },
      { name: 'Rainbow', icon: Rainbow },
      { name: 'Cloudy', icon: Cloudy },
      { name: 'CloudLightning', icon: CloudLightning },
    ],
  },
  shopping: {
    label: 'Shopping',
    labelAr: 'التسوق',
    icons: [
      { name: 'ShoppingCart', icon: ShoppingCart },
      { name: 'ShoppingBag', icon: ShoppingBag },
      { name: 'Package', icon: Package },
      { name: 'Gift', icon: Gift },
      { name: 'Tag', icon: Tag },
      { name: 'Percent', icon: Percent },
      { name: 'Receipt', icon: Receipt },
      { name: 'Store', icon: Store },
      { name: 'Truck', icon: Truck },
      { name: 'Card', icon: Card },
      { name: 'Coins', icon: Coins },
      { name: 'BadgeDollarSign', icon: BadgeDollarSign },
      { name: 'BadgePercent', icon: BadgePercent },
    ],
  },
  education: {
    label: 'Education',
    labelAr: 'التعليم',
    icons: [
      { name: 'BookOpen', icon: BookOpen },
      { name: 'GraduationCap', icon: GraduationCap },
      { name: 'Library', icon: Library },
      { name: 'Microscope', icon: Microscope },
      { name: 'Atom', icon: Atom },
      { name: 'FlaskConical', icon: FlaskConical },
      { name: 'Lightbulb', icon: Lightbulb },
      { name: 'Brain', icon: Brain },
      { name: 'Target', icon: Target },
      { name: 'Award', icon: Award },
      { name: 'Trophy', icon: Trophy },
      { name: 'Medal', icon: Medal },
      { name: 'Beaker', icon: Beaker },
      { name: 'TestTube', icon: TestTube },
      { name: 'Dna', icon: Dna },
      { name: 'Telescope', icon: Telescope },
      { name: 'Glasses', icon: Glasses },
      { name: 'BookMarked', icon: BookMarked },
      { name: 'Notebook', icon: Notebook },
      { name: 'PenTool', icon: PenTool },
      { name: 'Pencil', icon: Pencil },
    ],
  },
  health: {
    label: 'Health',
    labelAr: 'الصحة',
    icons: [
      { name: 'Activity', icon: Activity },
      { name: 'HeartPulse', icon: HeartPulse },
      { name: 'Pill', icon: Pill },
      { name: 'Stethoscope', icon: Stethoscope },
      { name: 'Thermometer', icon: Thermometer },
      { name: 'Syringe', icon: Syringe },
      { name: 'Cross', icon: Cross },
      { name: 'Ambulance', icon: Ambulance },
      { name: 'Hospital', icon: Hospital },
      { name: 'Accessibility', icon: Accessibility },
    ],
  },
  food: {
    label: 'Food',
    labelAr: 'الطعام',
    icons: [
      { name: 'Coffee', icon: Coffee },
      { name: 'UtensilsCrossed', icon: UtensilsCrossed },
      { name: 'Wine', icon: Wine },
      { name: 'Pizza', icon: Pizza },
      { name: 'Apple', icon: Apple },
      { name: 'Cake', icon: Cake },
      { name: 'Soup', icon: Soup },
      { name: 'Salad', icon: Salad },
      { name: 'IceCream', icon: IceCream },
      { name: 'Sandwich', icon: Sandwich },
      { name: 'Cookie', icon: Cookie },
      { name: 'Croissant', icon: Croissant },
      { name: 'Egg', icon: Egg },
      { name: 'Fish', icon: Fish },
      { name: 'Beef', icon: Beef },
      { name: 'Carrot', icon: Carrot },
    ],
  },
  travel: {
    label: 'Travel',
    labelAr: 'السفر',
    icons: [
      { name: 'Plane', icon: Plane },
      { name: 'Car', icon: Car },
      { name: 'Bus', icon: Bus },
      { name: 'Train', icon: Train },
      { name: 'Ship', icon: Ship },
      { name: 'Bike', icon: Bike },
      { name: 'MapPin', icon: MapPin },
      { name: 'Map', icon: Map },
      { name: 'Compass', icon: Compass },
      { name: 'Navigation', icon: Navigation },
      { name: 'Hotel', icon: Hotel },
      { name: 'Luggage', icon: Luggage },
      { name: 'Palmtree', icon: Palmtree },
      { name: 'Tent', icon: Tent },
      { name: 'Anchor', icon: Anchor },
      { name: 'Sailboat', icon: Sailboat },
      { name: 'Fuel', icon: Fuel },
      { name: 'PlaneTakeoff', icon: PlaneTakeoff },
      { name: 'PlaneLanding', icon: PlaneLanding },
    ],
  },
  tools: {
    label: 'Tools',
    labelAr: 'الأدوات',
    icons: [
      { name: 'Settings', icon: Settings },
      { name: 'Wrench', icon: Wrench },
      { name: 'Hammer', icon: Hammer },
      { name: 'Scissors', icon: Scissors },
      { name: 'Key', icon: Key },
      { name: 'Lock', icon: Lock },
      { name: 'Unlock', icon: Unlock },
      { name: 'Shield', icon: Shield },
      { name: 'Cog', icon: Cog },
      { name: 'SlidersHorizontal', icon: SlidersHorizontal },
      { name: 'Filter', icon: Filter },
      { name: 'SearchIcon', icon: SearchIcon },
      { name: 'Scan', icon: Scan },
      { name: 'QrCode', icon: QrCode },
    ],
  },
  shapes: {
    label: 'Shapes',
    labelAr: 'الأشكال',
    icons: [
      { name: 'Circle', icon: Circle },
      { name: 'Square', icon: Square },
      { name: 'Triangle', icon: Triangle },
      { name: 'Star', icon: Star },
      { name: 'Hexagon', icon: Hexagon },
      { name: 'Octagon', icon: Octagon },
      { name: 'Pentagon', icon: Pentagon },
      { name: 'Plus', icon: Plus },
      { name: 'Minus', icon: Minus },
      { name: 'X', icon: X },
      { name: 'Check', icon: Check },
      { name: 'Diamond', icon: Diamond },
      { name: 'Spade', icon: Spade },
      { name: 'Club', icon: Club },
      { name: 'HeartShape', icon: HeartShape },
      { name: 'Infinity', icon: Infinity },
      { name: 'Hash', icon: Hash },
      { name: 'Asterisk', icon: Asterisk },
    ],
  },
  alerts: {
    label: 'Alerts',
    labelAr: 'التنبيهات',
    icons: [
      { name: 'AlertCircle', icon: AlertCircle },
      { name: 'AlertTriangle', icon: AlertTriangle },
      { name: 'Info', icon: Info },
      { name: 'HelpCircle', icon: HelpCircle },
      { name: 'Bell', icon: Bell },
    ],
  },
  charts: {
    label: 'Charts',
    labelAr: 'الرسوم البيانية',
    icons: [
      { name: 'BarChart', icon: BarChart },
      { name: 'BarChart2', icon: BarChart2 },
      { name: 'PieChart', icon: PieChart },
      { name: 'TrendingUp', icon: TrendingUp },
      { name: 'TrendingDown', icon: TrendingDown },
      { name: 'LineChart', icon: LineChart },
      { name: 'BarChart4', icon: BarChart4 },
      { name: 'ChartLine', icon: ChartLine },
      { name: 'AreaChart', icon: AreaChart },
      { name: 'CandlestickChart', icon: CandlestickChart },
    ],
  },
  files: {
    label: 'Files',
    labelAr: 'الملفات',
    icons: [
      { name: 'File', icon: File },
      { name: 'Document', icon: Document },
      { name: 'FilePlus', icon: FilePlus },
      { name: 'FileCheck', icon: FileCheck },
      { name: 'FolderOpen', icon: FolderOpen },
      { name: 'Archive', icon: Archive },
      { name: 'Clipboard', icon: Clipboard },
      { name: 'Files', icon: Files },
      { name: 'FolderPlus', icon: FolderPlus },
      { name: 'FolderMinus', icon: FolderMinus },
      { name: 'FileEdit', icon: FileEdit },
      { name: 'FileSpreadsheet', icon: FileSpreadsheet },
      { name: 'FileImage', icon: FileImage },
      { name: 'FileVideo', icon: FileVideo },
    ],
  },
  misc: {
    label: 'Misc',
    labelAr: 'متنوع',
    icons: [
      { name: 'Zap', icon: Zap },
      { name: 'Flame', icon: Flame },
      { name: 'Sparkles', icon: Sparkles },
      { name: 'Crown', icon: Crown },
      { name: 'Flag', icon: Flag },
      { name: 'Bookmark', icon: Bookmark },
      { name: 'Eye', icon: Eye },
      { name: 'EyeOff', icon: EyeOff },
      { name: 'Link', icon: Link },
      { name: 'ExternalLink', icon: ExternalLink },
      { name: 'Download', icon: Download },
      { name: 'Upload', icon: Upload },
      { name: 'RefreshCw', icon: RefreshCw },
      { name: 'RotateCw', icon: RotateCw },
      { name: 'Maximize', icon: Maximize },
      { name: 'Minimize', icon: Minimize },
      { name: 'Home', icon: Home },
      { name: 'Inbox', icon: Inbox },
      { name: 'Layers', icon: Layers },
      { name: 'Layout', icon: Layout },
      { name: 'Grid', icon: Grid },
      { name: 'List', icon: List },
      { name: 'Menu', icon: Menu },
      { name: 'MoreHorizontal', icon: MoreHorizontal },
      { name: 'MoreVertical', icon: MoreVertical },
      { name: 'Pin', icon: Pin },
      { name: 'Paperclip', icon: Paperclip },
      { name: 'Stamp', icon: Stamp },
      { name: 'Timer', icon: Timer },
      { name: 'Hourglass', icon: Hourglass },
      { name: 'Watch', icon: Watch },
      { name: 'AlarmClock', icon: AlarmClock },
      { name: 'CalendarDays', icon: CalendarDays },
    ],
  },
};

// Preset colors for icons
const ICON_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e3a5f',
];

// Custom icon storage key
const CUSTOM_ICONS_KEY = 'slideforge_custom_icons';

// Custom icon interface
interface CustomIcon {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

// Load custom icons from localStorage
const loadCustomIcons = (): CustomIcon[] => {
  try {
    const data = localStorage.getItem(CUSTOM_ICONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save custom icons to localStorage
const saveCustomIcons = (icons: CustomIcon[]) => {
  try {
    localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(icons));
  } catch (e) {
    console.error('Failed to save custom icons:', e);
  }
};

export interface IconConfig {
  name: string;
  color: string;
  size: number;
  strokeWidth: number;
  backgroundColor?: string;
  backgroundRadius?: number;
  rotation?: number;
  customImageUrl?: string; // For custom uploaded icons
}

interface IconLibraryProps {
  onSelectIcon: (config: IconConfig) => void;
  trigger?: React.ReactNode;
}


export const IconLibrary = ({ onSelectIcon, trigger }: IconLibraryProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('business');
  const [selectedIcon, setSelectedIcon] = useState<{ name: string; icon: React.ComponentType<any> } | null>(null);
  const [selectedCustomIcon, setSelectedCustomIcon] = useState<CustomIcon | null>(null);
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);

  // Load custom icons on mount and listen for changes
  useEffect(() => {
    setCustomIcons(loadCustomIcons());
    
    // Listen for storage changes (when icons are added from context menu)
    const handleStorageChange = () => {
      setCustomIcons(loadCustomIcons());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically when dialog opens
    if (isOpen) {
      setCustomIcons(loadCustomIcons());
    }
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isOpen]);

  // Icon customization state
  const [iconColor, setIconColor] = useState('#000000');
  const [iconSize, setIconSize] = useState(48);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [backgroundRadius, setBackgroundRadius] = useState(8);
  const [rotation, setRotation] = useState(0);

  // Get all icons for search
  const allIcons = useMemo(() => {
    const icons: { name: string; icon: React.ComponentType<any>; category: string }[] = [];
    Object.entries(ICON_CATEGORIES).forEach(([categoryKey, category]) => {
      category.icons.forEach((iconItem) => {
        icons.push({ ...iconItem, category: categoryKey });
      });
    });
    return icons;
  }, []);

  // Filter icons based on search (including custom icons)
  const filteredIcons = useMemo(() => {
    if (activeCategory === 'custom') {
      if (!searchQuery.trim()) return [];
      return customIcons.filter((icon) =>
        icon.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (!searchQuery.trim()) {
      return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES]?.icons || [];
    }
    return allIcons.filter((icon) =>
      icon.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, activeCategory, allIcons, customIcons]);

  // Delete custom icon
  const handleDeleteCustomIcon = (iconId: string) => {
    setCustomIcons((prev) => {
      const updated = prev.filter((icon) => icon.id !== iconId);
      saveCustomIcons(updated);
      return updated;
    });
    if (selectedCustomIcon?.id === iconId) {
      setSelectedCustomIcon(null);
    }
    toast.success(language === 'ar' ? 'تم حذف الأيقونة' : 'Icon deleted');
  };

  const handleIconSelect = (iconItem: { name: string; icon: React.ComponentType<any> }) => {
    setSelectedIcon(iconItem);
    setSelectedCustomIcon(null);
  };

  const handleCustomIconSelect = (icon: CustomIcon) => {
    setSelectedCustomIcon(icon);
    setSelectedIcon(null);
  };

  const handleAddIcon = () => {
    // Handle custom icon
    if (selectedCustomIcon) {
      const config: IconConfig = {
        name: selectedCustomIcon.name,
        color: iconColor,
        size: iconSize,
        strokeWidth,
        backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
        backgroundRadius,
        rotation,
        customImageUrl: selectedCustomIcon.dataUrl,
      };

      onSelectIcon(config);
      setIsOpen(false);
      resetState();
      toast.success(language === 'ar' ? 'تمت إضافة الأيقونة!' : 'Icon added!');
      return;
    }

    if (!selectedIcon) {
      toast.error(language === 'ar' ? 'اختر أيقونة أولاً' : 'Select an icon first');
      return;
    }

    const config: IconConfig = {
      name: selectedIcon.name,
      color: iconColor,
      size: iconSize,
      strokeWidth,
      backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
      backgroundRadius,
      rotation,
    };

    onSelectIcon(config);
    setIsOpen(false);
    resetState();
    toast.success(language === 'ar' ? 'تمت إضافة الأيقونة!' : 'Icon added!');
  };

  const resetState = () => {
    setSelectedIcon(null);
    setSelectedCustomIcon(null);
    setSearchQuery('');
    setIconColor('#000000');
    setIconSize(48);
    setStrokeWidth(2);
    setBackgroundColor('transparent');
    setBackgroundRadius(8);
    setRotation(0);
  };

  const categoryKeys = ['custom', ...Object.keys(ICON_CATEGORIES)];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Smile className="w-4 h-4" />
            {language === 'ar' ? 'مكتبة الأيقونات' : 'Icon Library'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Smile className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'مكتبة الأيقونات' : 'Icon Library'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Left Panel - Icon Selection */}
          <div className="flex-1 border-r border-border/50 flex flex-col min-w-0 bg-muted/10">
            {/* Search */}
            <div className="p-4 border-b border-border/50">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  placeholder={language === 'ar' ? 'ابحث عن أيقونة...' : 'Search icons...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Categories */}
            {!searchQuery && (
              <div className="border-b border-border/50 p-3 bg-muted/5">
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
                  {categoryKeys.map((key) => {
                    if (key === 'custom') {
                      return (
                        <Button
                          key={key}
                          variant={activeCategory === key ? 'default' : 'outline'}
                          size="sm"
                          className={`text-xs whitespace-nowrap h-8 transition-all ${
                            activeCategory === key 
                              ? 'bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20' 
                              : 'hover:bg-primary/10 hover:border-primary/50'
                          }`}
                          onClick={() => setActiveCategory(key)}
                        >
                          <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                          {language === 'ar' ? 'الإضافات' : 'Custom'}
                          {customIcons.length > 0 && (
                            <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                              {customIcons.length}
                            </span>
                          )}
                        </Button>
                      );
                    }
                    const category = ICON_CATEGORIES[key as keyof typeof ICON_CATEGORIES];
                    return (
                      <Button
                        key={key}
                        variant={activeCategory === key ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs whitespace-nowrap h-8 transition-all ${
                          activeCategory === key 
                            ? 'bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20' 
                            : 'hover:bg-primary/10 hover:border-primary/50'
                        }`}
                        onClick={() => setActiveCategory(key)}
                      >
                        {language === 'ar' ? category.labelAr : category.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Icons Grid */}
            <ScrollArea className="flex-1 p-4">
              {/* Custom Icons Section */}
              {activeCategory === 'custom' && !searchQuery && (
                <div className="space-y-4">
                  {/* Custom Icons Grid */}
                  {customIcons.length > 0 ? (
                    <div className="grid grid-cols-8 gap-3">
                      {customIcons.map((icon) => {
                        const isSelected = selectedCustomIcon?.id === icon.id;
                        return (
                          <div key={icon.id} className="relative group">
                            <button
                              onClick={() => handleCustomIconSelect(icon)}
                              className={`w-full aspect-square p-3 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg shadow-primary/20 scale-105'
                                  : 'border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-105 hover:shadow-md'
                              }`}
                              title={icon.name}
                            >
                              <img
                                src={icon.dataUrl}
                                alt={icon.name}
                                className="w-full h-full object-contain"
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomIcon(icon.id)}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-110"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                        <ImagePlus className="w-10 h-10 text-primary/40" />
                      </div>
                      <p className="text-sm font-medium">
                        {language === 'ar' 
                          ? 'لا توجد إضافات. اضغط كليك يمين على أي صورة في الشريحة واختر "إضافة للإضافات".'
                          : 'No custom icons. Right-click any image on the slide and select "Add to Custom".'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Icons Grid */}
              {activeCategory !== 'custom' && (
                <div className="grid grid-cols-10 gap-2">
                  {(filteredIcons as { name: string; icon: React.ComponentType<any> }[]).map((iconItem) => {
                    const IconComponent = iconItem.icon;
                    const isSelected = selectedIcon?.name === iconItem.name;
                    return (
                      <button
                        key={iconItem.name}
                        onClick={() => handleIconSelect(iconItem)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 group ${
                          isSelected
                            ? 'border-primary bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg shadow-primary/20 scale-105'
                            : 'border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-110 hover:shadow-md'
                        }`}
                        title={iconItem.name}
                      >
                        <IconComponent className={`w-6 h-6 mx-auto transition-transform ${isSelected ? 'text-primary' : 'group-hover:text-primary'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
              {activeCategory !== 'custom' && filteredIcons.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium">
                    {language === 'ar' ? 'لا توجد أيقونات' : 'No icons found'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Customization */}
          <div className="w-80 flex flex-col bg-gradient-to-b from-muted/20 to-muted/10 border-l border-border/50">
            {/* Preview */}
            <div className="p-5 border-b border-border/50">
              <Label className="text-sm font-semibold mb-3 block text-foreground/80">
                {language === 'ar' ? 'معاينة' : 'Preview'}
              </Label>
              <div className="flex items-center justify-center h-36 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-inner">
                {selectedCustomIcon ? (
                  <div
                    className="flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
                      borderRadius: backgroundRadius,
                      padding: backgroundColor !== 'transparent' ? 12 : 0,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={selectedCustomIcon.dataUrl}
                      alt={selectedCustomIcon.name}
                      style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : selectedIcon ? (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
                      borderRadius: backgroundRadius,
                      padding: backgroundColor !== 'transparent' ? 12 : 0,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <selectedIcon.icon
                      style={{
                        width: iconSize,
                        height: iconSize,
                        color: iconColor,
                        strokeWidth,
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {language === 'ar' ? 'اختر أيقونة' : 'Select an icon'}
                  </span>
                )}
              </div>
              {(selectedIcon || selectedCustomIcon) && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {selectedIcon?.name || selectedCustomIcon?.name}
                </p>
              )}
            </div>

            {/* Customization Options */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Color - only for non-custom icons */}
                {!selectedCustomIcon && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ar' ? 'اللون' : 'Color'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setIconColor(color)}
                        className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                          iconColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-7 h-7 rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-primary">
                          <Plus className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <input
                          type="color"
                          value={iconColor}
                          onChange={(e) => setIconColor(e.target.value)}
                          className="w-32 h-32 cursor-pointer"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                )}

                {/* Size */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">
                      {language === 'ar' ? 'الحجم' : 'Size'}
                    </Label>
                    <span className="text-sm text-muted-foreground">{iconSize}px</span>
                  </div>
                  <Slider
                    value={[iconSize]}
                    onValueChange={([value]) => setIconSize(value)}
                    min={16}
                    max={128}
                    step={4}
                  />
                </div>

                {/* Stroke Width - only for non-custom icons */}
                {!selectedCustomIcon && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">
                      {language === 'ar' ? 'سمك الخط' : 'Stroke Width'}
                    </Label>
                    <span className="text-sm text-muted-foreground">{strokeWidth}</span>
                  </div>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={([value]) => setStrokeWidth(value)}
                    min={0.5}
                    max={4}
                    step={0.5}
                  />
                </div>
                )}

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">
                      {language === 'ar' ? 'الدوران' : 'Rotation'}
                    </Label>
                    <span className="text-sm text-muted-foreground">{rotation}°</span>
                  </div>
                  <Slider
                    value={[rotation]}
                    onValueChange={([value]) => setRotation(value)}
                    min={0}
                    max={360}
                    step={15}
                  />
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBackgroundColor('transparent')}
                      className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                        backgroundColor === 'transparent' ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {ICON_COLORS.slice(0, 8).map((color) => (
                      <button
                        key={`bg-${color}`}
                        onClick={() => setBackgroundColor(color)}
                        className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                          backgroundColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Radius */}
                {backgroundColor !== 'transparent' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">
                        {language === 'ar' ? 'استدارة الخلفية' : 'Background Radius'}
                      </Label>
                      <span className="text-sm text-muted-foreground">{backgroundRadius}px</span>
                    </div>
                    <Slider
                      value={[backgroundRadius]}
                      onValueChange={([value]) => setBackgroundRadius(value)}
                      min={0}
                      max={50}
                      step={2}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Add Button */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={handleAddIcon}
                className="w-full"
                disabled={!selectedIcon && !selectedCustomIcon}
              >
                {language === 'ar' ? 'إضافة الأيقونة' : 'Add Icon'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconLibrary;
