import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { SlidePanel } from '@/components/editor/SlidePanel';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PresentationMode } from '@/components/editor/PresentationMode';
import { SpeakerNotes, SlideNotes } from '@/components/editor/SpeakerNotes';
import { PreviewMode } from '@/components/editor/PreviewMode';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { ActivityPanel } from '@/components/editor/ActivityPanel';
import { ExportImagesDialog } from '@/components/editor/ExportImagesDialog';
import { ElementGroup, alignElements, distributeElements, createGroup } from '@/components/editor/GroupingControls';
import { CopiedStyle } from '@/components/editor/CopyPasteStyles';
import { SlideTransition } from '@/components/editor/AnimationControls';
import { getTemplateById, SlideTemplate, SlideElement } from '@/data/templates';
import { saintLuciaGastronomyTemplate } from '@/data/templates/saint-lucia-gastronomy';
import { exportToPptx, exportToPdf, exportToImages } from '@/lib/exportUtils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useEditorTracking } from '@/hooks/useEditorTracking';
import { useLimits } from '@/hooks/useLimits';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { savePresentation, getPresentationById } from '@/lib/storage';
import { toast } from 'sonner';
import { SavedPresentation } from './Dashboard';
import { PanelLeft, PanelRight, ChevronLeft, ChevronRight, Type, Square, Circle, Image, Plus } from 'lucide-react';

const createDefaultSlide = (id: string): SlideTemplate => ({
  id,
  type: 'content',
  title: 'New Slide',
  content: ['Add your content here'],
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  elements: [],
});

// Get the default template slide (Saint Lucia Gastronomy)
const getDefaultTemplateSlide = (): SlideTemplate => {
  const defaultSlide = saintLuciaGastronomyTemplate.slides[0];
  return {
    ...defaultSlide,
    id: 'slide-1',
  };
};

export const Editor = () => {
  const [searchParams] = useSearchParams();
  const { language, direction } = useLanguage();
  const isMobile = useIsMobile();
  const isRtl = direction === 'rtl';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackAction, trackSlideChange, trackTemplateUsage } = useEditorTracking();
  const { canAddSlide, canAddElement, canExport, quickCheck } = useLimits();
  const templateId = searchParams.get('template');
  const presentationId = searchParams.get('id');
  
  const [presentationTitle, setPresentationTitle] = useState('Untitled Presentation');
  const [slides, setSlides] = useState<SlideTemplate[]>([getDefaultTemplateSlide()]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportImagesOpen, setIsExportImagesOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [clipboard, setClipboard] = useState<SlideElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState<SlideNotes>({});
  const [zoom, setZoom] = useState(100);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<ElementGroup[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(960);
  const [canvasHeight, setCanvasHeight] = useState(540);
  const [slideTransitions, setSlideTransitions] = useState<Record<string, SlideTransition>>({});
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempPresentationName, setTempPresentationName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Panel visibility states
  const [showSlidesPanel, setShowSlidesPanel] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const saved = localStorage.getItem('editor-slides-panel-visible');
    if (saved !== null) return saved === 'true';
    return !isMobile;
  });
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const saved = localStorage.getItem('editor-properties-panel-visible');
    if (saved !== null) return saved === 'true';
    return !isMobile;
  });
  const [showRulers, setShowRulers] = useState(false);
  const [showGuides, setShowGuides] = useState(() => {
    const saved = localStorage.getItem('editor-guides-enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Undo/Redo history
  const [history, setHistory] = useState<SlideTemplate[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Save panel visibility to localStorage
  useEffect(() => {
    localStorage.setItem('editor-slides-panel-visible', String(showSlidesPanel));
  }, [showSlidesPanel]);

  useEffect(() => {
    localStorage.setItem('editor-properties-panel-visible', String(showPropertiesPanel));
  }, [showPropertiesPanel]);

  useEffect(() => {
    localStorage.setItem('editor-rulers-visible', String(showRulers));
  }, [showRulers]);

  useEffect(() => {
    localStorage.setItem('editor-guides-enabled', String(showGuides));
  }, [showGuides]);

  // Close side panels by default on mobile so the canvas uses the full width
  useEffect(() => {
    if (isMobile) {
      setShowSlidesPanel(false);
      setShowPropertiesPanel(false);
    }
  }, [isMobile]);

  // On mobile screens the side panels are floating overlays - start them closed
  // so the canvas gets the full screen width.
  useEffect(() => {
    if (isMobile) {
      setShowSlidesPanel(false);
      setShowPropertiesPanel(false);
      setShowRulers(false);
    }
  }, [isMobile]);

  // Generate a unique key for this presentation
  const autosaveKey = useMemo(() => {
    // If we have a presentation ID or template ID, use it
    if (presentationId) return presentationId;
    if (templateId) return templateId;
    
    // Otherwise, check if we have a saved key in sessionStorage
    const savedKey = sessionStorage.getItem('current_presentation_key');
    if (savedKey) {
      console.log('Using saved presentation key:', savedKey);
      return savedKey;
    }
    
    // Create a new key and save it
    const newKey = `presentation-${Date.now()}`;
    sessionStorage.setItem('current_presentation_key', newKey);
    console.log('Created new presentation key:', newKey);
    return newKey;
  }, [presentationId, templateId]);

  // Update URL with presentation ID if not present
  useEffect(() => {
    if (!presentationId && !templateId && autosaveKey && isInitialized) {
      const newUrl = `/editor?id=${autosaveKey}`;
      window.history.replaceState({}, '', newUrl);
      console.log('Updated URL with presentation ID:', autosaveKey);
    }
  }, [autosaveKey, presentationId, templateId, isInitialized]);

  // Save to history when slides change
  useEffect(() => {
    if (!isInitialized) return;
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    // Add current state to history
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(slides)));
      // Keep only last 50 states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [slides, isInitialized]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    isUndoRedoAction.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setSlides(JSON.parse(JSON.stringify(history[newIndex])));
    toast.success(language === 'ar' ? 'تم التراجع' : 'Undo');
  }, [historyIndex, history, language]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    isUndoRedoAction.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setSlides(JSON.parse(JSON.stringify(history[newIndex])));
    toast.success(language === 'ar' ? 'تم الإعادة' : 'Redo');
  }, [historyIndex, history, language]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Autosave data structure (for manual save only)
  const autosaveData = useMemo(() => ({
    title: presentationTitle,
    slides,
    activeSlideIndex,
    speakerNotes,
  }), [presentationTitle, slides, activeSlideIndex, speakerNotes]);

  const activeSlide = slides[activeSlideIndex];
  const selectedElement = activeSlide?.elements?.find(el => el.id === selectedElementId) || null;

  // Generate random transition for a slide
  const getRandomTransition = useCallback((): SlideTransition => {
    const transitionTypes = [
      'fade', 'dissolve',
      'slide-left', 'slide-right', 'slide-up', 'slide-down',
      'zoom', 'zoom-rotate',
      'flip-x', 'flip-y', 'flip-3d',
      'cube', 'cube-left', 'cube-right',
      'carousel', 'cards', 'fold', 'unfold',
      'wipe-left', 'wipe-right', 'wipe-up', 'wipe-down',
      'circle', 'diamond', 'curtain', 'blinds',
      'cover', 'reveal', 'gallery', 'conveyor', 'door', 'fall-over', 'vortex', 'ripple',
    ];
    
    const randomType = transitionTypes[Math.floor(Math.random() * transitionTypes.length)];
    const randomDuration = 0.3 + Math.random() * 0.7; // Between 0.3 and 1.0 seconds
    
    return {
      type: randomType as any,
      duration: Number(randomDuration.toFixed(2)),
    };
  }, []);

  // Reload presentation from localStorage
  const reloadPresentation = useCallback(async () => {
    if (!autosaveKey) return;
    
    try {
      const pres = getPresentationById(autosaveKey, user?.id || 0);
      if (pres) {
        const data = JSON.parse(pres.data);
        setPresentationTitle(pres.title);
        setSlides(data.slides || [getDefaultTemplateSlide()]);
        setSpeakerNotes(data.speakerNotes || {});
        setSlideTransitions(data.slideTransitions || {});
        setCanvasWidth(data.canvasWidth || 960);
        setCanvasHeight(data.canvasHeight || 540);
        toast.success(language === 'ar' ? 'تم تحديث العرض!' : 'Presentation refreshed!');
      }
    } catch (error) {
      console.error('Error reloading presentation:', error);
    }
  }, [autosaveKey, user, language]);

  // Initialize from template or restore saved work from localStorage
  useEffect(() => {
    if (isInitialized) return;

    const initializeEditor = async () => {
      console.log('Initializing editor with key:', autosaveKey);
      
      // Load from template if specified
      if (templateId) {
        const template = getTemplateById(templateId);
        if (template) {
          setPresentationTitle(template.titleKey);
          setSlides(template.slides.map(slide => ({
            ...slide,
            elements: slide.elements || [],
          })));
          trackAction('use_template', autosaveKey, templateId);
          trackTemplateUsage(templateId, template.titleKey, 'use', autosaveKey);
        }
        setIsInitialized(true);
      } else if (presentationId) {
        // Load from localStorage if presentation ID is provided
        reloadPresentation();
        setIsInitialized(true);
      } else {
        // New presentation - show name dialog
        setShowNameDialog(true);
        setIsInitialized(true);
      }
      
      trackAction('open_editor', autosaveKey);
    };

    initializeEditor();
  }, [templateId, presentationId, autosaveKey, isInitialized, user, language, trackAction, trackTemplateUsage, reloadPresentation]);

  // Assign random transitions to slides that don't have one
  useEffect(() => {
    if (!isInitialized || slides.length === 0) return;
    
    const newTransitions: Record<string, SlideTransition> = { ...slideTransitions };
    let hasChanges = false;
    
    slides.forEach(slide => {
      if (!newTransitions[slide.id]) {
        newTransitions[slide.id] = getRandomTransition();
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setSlideTransitions(newTransitions);
    }
  }, [slides, isInitialized, getRandomTransition]);

  // Handle presentation name submission
  const handlePresentationNameSubmit = useCallback(async () => {
    if (!tempPresentationName.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال اسم العرض' : 'Please enter presentation name');
      return;
    }
    
    if (isCreatingNew) {
      // Save current presentation first
      if (autosaveKey) {
        setIsSaving(true);
        try {
          savePresentation({
            id: autosaveKey,
            userId: user?.id || 0,
            title: presentationTitle,
            slideCount: slides.length,
            data: JSON.stringify({
              slides,
              speakerNotes,
              slideTransitions,
              canvasWidth,
              canvasHeight,
            }),
          });
        } catch (error) {
          console.error('Save error:', error);
        } finally {
          setIsSaving(false);
        }
      }
      
      // Clear session and create new presentation
      sessionStorage.removeItem('current_presentation_key');
      
      // Reset editor state
      setPresentationTitle(tempPresentationName.trim());
      setSlides([getDefaultTemplateSlide()]);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setSpeakerNotes({});
      setSlideTransitions({});
      setHistory([]);
      setHistoryIndex(-1);
      
      // Generate new key
      const newKey = `presentation-${Date.now()}`;
      sessionStorage.setItem('current_presentation_key', newKey);
      
      // Update URL
      window.history.replaceState({}, '', `/editor?id=${newKey}`);
      
      setShowNameDialog(false);
      setIsCreatingNew(false);
      setTempPresentationName('');
      
      toast.success(language === 'ar' ? 'تم إنشاء عرض جديد' : 'New presentation created');
    } else {
      // First time creating presentation
      setPresentationTitle(tempPresentationName.trim());
      setShowNameDialog(false);
      toast.success(language === 'ar' ? 'تم إنشاء العرض التقديمي' : 'Presentation created');
    }
  }, [tempPresentationName, language, isCreatingNew, autosaveKey, user, presentationTitle, slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight]);

  // Handle creating new presentation from toolbar
  const handleCreateNew = useCallback(async () => {
    setTempPresentationName('');
    setIsCreatingNew(true);
    setShowNameDialog(true);
  }, []);

  const handleAddSlide = useCallback(async () => {
    // Check slide limit
    const limitCheck = await canAddSlide(autosaveKey);
    if (!limitCheck.allowed) return;
    
    const newSlide = createDefaultSlide(`slide-${Date.now()}`);
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setSelectedElementId(null);
    
    // Assign random transition to the new slide
    const randomTransition = getRandomTransition();
    setSlideTransitions(prev => ({
      ...prev,
      [newSlide.id]: randomTransition,
    }));
    
    trackAction('create_slide', autosaveKey);
    toast.success('Slide added!');
  }, [slides.length, trackAction, autosaveKey, canAddSlide, getRandomTransition]);

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(newSlides.length - 1);
    } else if (activeSlideIndex > index) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
    setSelectedElementId(null);
    trackAction('delete_slide', autosaveKey);
    toast.success('Slide deleted!');
  };

  // Delete current slide (for LayoutTools)
  const handleDeleteCurrentSlide = useCallback(() => {
    if (slides.length <= 1) return;
    handleDeleteSlide(activeSlideIndex);
  }, [slides.length, activeSlideIndex]);

  // Duplicate current slide
  const handleDuplicateSlide = useCallback(() => {
    const currentSlide = slides[activeSlideIndex];
    const newSlide: SlideTemplate = {
      ...currentSlide,
      id: `slide-${Date.now()}`,
      elements: currentSlide.elements?.map(el => ({
        ...el,
        id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      })),
    };
    trackAction('duplicate_slide', autosaveKey);
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
    
    // Assign random transition to the duplicated slide
    const randomTransition = getRandomTransition();
    setSlideTransitions(prev => ({
      ...prev,
      [newSlide.id]: randomTransition,
    }));
    
    toast.success(language === 'ar' ? 'تم تكرار الشريحة!' : 'Slide duplicated!');
  }, [slides, activeSlideIndex, getRandomTransition]);

  // Move slide up or down
  const handleMoveSlide = useCallback((direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    
    const newSlides = [...slides];
    [newSlides[activeSlideIndex], newSlides[newIndex]] = [newSlides[newIndex], newSlides[activeSlideIndex]];
    setSlides(newSlides);
    setActiveSlideIndex(newIndex);
    toast.success(language === 'ar' ? 'تم نقل الشريحة!' : 'Slide moved!');
  }, [slides, activeSlideIndex]);

  const updateSlide = useCallback((updates: Partial<SlideTemplate>) => {
    setSlides(prevSlides => prevSlides.map((slide, index) =>
      index === activeSlideIndex ? { ...slide, ...updates } : slide
    ));
  }, [activeSlideIndex]);

  const handleAddElement = useCallback(async (element: Omit<SlideElement, 'id'>) => {
    // Check element limit
    const currentElements = activeSlide.elements || [];
    const limitCheck = await canAddElement(currentElements.length);
    if (!limitCheck.allowed) return;
    
    // Calculate the highest z-index
    const maxZIndex = currentElements.reduce((max, el) => {
      const zIndex = el.zIndex || 0;
      return Math.max(max, zIndex);
    }, 0);
    
    // Use both timestamp and random string to ensure unique IDs even when called rapidly
    const newElement: SlideElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: maxZIndex + 1, // Add on top of all existing elements
    };
    
    updateSlide({ elements: [...currentElements, newElement] });
    setSelectedElementId(newElement.id);
    trackAction('add_element', autosaveKey, element.type);
    trackSlideChange(autosaveKey, activeSlide.id, `add_${element.type}` as any, newElement.id, element.type, null, newElement);
  }, [activeSlide, updateSlide, trackAction, trackSlideChange, autosaveKey, canAddElement]);

  // Add multiple elements at once (for decorations, etc.)
  const handleAddElements = useCallback(async (elements: Omit<SlideElement, 'id'>[]) => {
    console.log('handleAddElements called with', elements.length, 'elements');
    const currentElements = activeSlide.elements || [];
    console.log('Current elements count:', currentElements.length);
    
    const limitCheck = await canAddElement(currentElements.length + elements.length - 1);
    console.log('Limit check result:', limitCheck);
    
    if (!limitCheck.allowed) {
      console.warn('Cannot add elements - limit reached');
      return;
    }
    
    // Calculate the highest z-index
    const maxZIndex = currentElements.reduce((max, el) => {
      const zIndex = el.zIndex || 0;
      return Math.max(max, zIndex);
    }, 0);
    
    const timestamp = Date.now();
    const newElements: SlideElement[] = elements.map((element, index) => ({
      ...element,
      id: `element-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: maxZIndex + 1 + index, // Each element gets incrementally higher z-index
    }));
    
    console.log('Adding new elements:', newElements);
    
    updateSlide({ elements: [...currentElements, ...newElements] });
    if (newElements.length > 0) {
      setSelectedElementId(newElements[newElements.length - 1].id);
    }
    trackAction('add_elements', autosaveKey, `${elements.length} elements`);
  }, [activeSlide, updateSlide, trackAction, autosaveKey, canAddElement]);

  const handleUpdateElement = useCallback((updates: Partial<SlideElement>) => {
    if (!selectedElementId || !activeSlide.elements) return;
    
    const oldElement = activeSlide.elements.find(el => el.id === selectedElementId);
    const newElements = activeSlide.elements.map(el =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    );
    updateSlide({ elements: newElements });
    
    // Track significant changes (not position/size during drag)
    const significantKeys = ['content', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'src', 'iconName'];
    const hasSignificantChange = Object.keys(updates).some(key => significantKeys.includes(key));
    if (hasSignificantChange && oldElement) {
      trackSlideChange(
        autosaveKey,
        activeSlide.id,
        'change_style',
        selectedElementId,
        oldElement.type,
        Object.fromEntries(Object.keys(updates).map(k => [k, (oldElement as any)[k]])),
        updates
      );
    }
  }, [selectedElementId, activeSlide, updateSlide, trackSlideChange, autosaveKey]);

  const handleDeleteElement = useCallback(() => {
    if (!selectedElementId || !activeSlide.elements) return;
    
    const newElements = activeSlide.elements.filter(el => el.id !== selectedElementId);
    updateSlide({ elements: newElements });
    setSelectedElementId(null);
    setSelectedElementIds([]);
    trackAction('delete_element', autosaveKey);
    toast.success('Element deleted!');
  }, [selectedElementId, activeSlide, updateSlide, trackAction, autosaveKey]);

  const handleDuplicateElement = useCallback((id: string) => {
    if (!activeSlide.elements) return;
    const element = activeSlide.elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement: SlideElement = {
      ...element,
      id: `element-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    updateSlide({ elements: [...activeSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
    toast.success('Element duplicated!');
  }, [activeSlide, updateSlide]);

  // Layers Panel handlers
  const handleUpdateElementById = useCallback((id: string, updates: Partial<SlideElement>) => {
    if (!activeSlide.elements) return;
    const newElements = activeSlide.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    updateSlide({ elements: newElements });
  }, [activeSlide, updateSlide]);

  const handleDeleteElementById = useCallback((id: string) => {
    if (!activeSlide.elements) return;
    const newElements = activeSlide.elements.filter(el => el.id !== id);
    updateSlide({ elements: newElements });
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    toast.success('Element deleted!');
  }, [activeSlide, updateSlide, selectedElementId]);

  const handleDuplicateElementById = useCallback((id: string) => {
    if (!activeSlide.elements) return;
    const element = activeSlide.elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement: SlideElement = {
      ...element,
      id: `element-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    updateSlide({ elements: [...activeSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
    toast.success('Element duplicated!');
  }, [activeSlide, updateSlide]);

  const handleReorderElements = useCallback((newElements: SlideElement[]) => {
    updateSlide({ elements: newElements });
  }, [updateSlide]);

  // Grouping handlers
  const handleGroup = useCallback((elementIds: string[]) => {
    if (elementIds.length < 2) return;
    const newGroup = createGroup(elementIds);
    setGroups(prev => [...prev, newGroup]);
    
    // Update elements with groupId
    if (activeSlide.elements) {
      const newElements = activeSlide.elements.map(el =>
        elementIds.includes(el.id) ? { ...el, groupId: newGroup.id } : el
      );
      updateSlide({ elements: newElements });
    }
    toast.success('Elements grouped!');
  }, [activeSlide, updateSlide]);

  const handleUngroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    // Remove groupId from elements
    if (activeSlide.elements) {
      const newElements = activeSlide.elements.map(el =>
        el.groupId === groupId ? { ...el, groupId: undefined } : el
      );
      updateSlide({ elements: newElements });
    }
    toast.success('Elements ungrouped!');
  }, [activeSlide, updateSlide]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    if (!activeSlide.elements) return;
    
    const newElements = activeSlide.elements.filter(el => !selectedElementIds.includes(el.id));
    updateSlide({ elements: newElements });
    setSelectedElementId(null);
    setSelectedElementIds([]);
    toast.success('Elements deleted!');
  }, [selectedElementIds, activeSlide, updateSlide]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0 && selectedElementId) {
      handleDuplicateElementById(selectedElementId);
      return;
    }
    if (!activeSlide.elements) return;
    
    const selectedElements = activeSlide.elements.filter(el => selectedElementIds.includes(el.id));
    const newElements = selectedElements.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      x: el.x + 20,
      y: el.y + 20,
    }));
    
    updateSlide({ elements: [...activeSlide.elements, ...newElements] });
    setSelectedElementIds(newElements.map(el => el.id));
    toast.success('Elements duplicated!');
  }, [selectedElementIds, selectedElementId, activeSlide, updateSlide, handleDuplicateElementById]);

  const handleAlignSelected = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!activeSlide.elements || selectedElementIds.length < 2) return;
    const newElements = alignElements(activeSlide.elements, selectedElementIds, alignment);
    updateSlide({ elements: newElements });
  }, [activeSlide, selectedElementIds, updateSlide]);

  const handleDistributeSelected = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!activeSlide.elements || selectedElementIds.length < 3) return;
    const newElements = distributeElements(activeSlide.elements, selectedElementIds, direction);
    updateSlide({ elements: newElements });
  }, [activeSlide, selectedElementIds, updateSlide]);

  const handleSlideTypeChange = useCallback((type: SlideTemplate['type']) => {
    // Generate default elements based on slide type
    const generateDefaultElements = (slideType: string): SlideElement[] => {
      const baseElements: SlideElement[] = [];
      const textColor = activeSlide.textColor || '#1f2937';
      
      switch (slideType) {
        case 'cover':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 180, width: 800, height: 80, content: 'Presentation Title', fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 80, y: 280, width: 800, height: 40, content: 'Subtitle goes here', fontSize: 24, fontWeight: 'normal', textAlign: 'center', color: textColor }
          );
          break;
        case 'content':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 60, y: 40, width: 840, height: 60, content: 'Slide Title', fontSize: 36, fontWeight: 'bold', textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 60, y: 120, width: 840, height: 40, content: '• First point', fontSize: 20, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 60, y: 170, width: 840, height: 40, content: '• Second point', fontSize: 20, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 60, y: 220, width: 840, height: 40, content: '• Third point', fontSize: 20, textAlign: 'left', color: textColor }
          );
          break;
        case 'section':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 220, width: 800, height: 80, content: 'Section Title', fontSize: 42, fontWeight: 'bold', textAlign: 'center', color: textColor }
          );
          break;
        case 'comparison':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Comparison', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 60, y: 120, width: 400, height: 40, content: 'Option A', fontSize: 24, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 500, y: 120, width: 400, height: 40, content: 'Option B', fontSize: 24, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 60, y: 170, width: 400, height: 300, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 12 },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 500, y: 170, width: 400, height: 300, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 12 }
          );
          break;
        case 'timeline':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Timeline', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 80, y: 270, width: 800, height: 4, shapeType: 'line', backgroundColor: textColor },
            { id: `el-${Date.now()}-3`, type: 'shape', x: 150, y: 255, width: 30, height: 30, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 380, y: 255, width: 30, height: 30, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 610, y: 255, width: 30, height: 30, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 840, y: 255, width: 30, height: 30, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 120, y: 300, width: 100, height: 30, content: '2020', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-8`, type: 'text', x: 350, y: 300, width: 100, height: 30, content: '2021', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-9`, type: 'text', x: 580, y: 300, width: 100, height: 30, content: '2022', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-10`, type: 'text', x: 810, y: 300, width: 100, height: 30, content: '2023', fontSize: 16, textAlign: 'center', color: textColor }
          );
          break;
        case 'team':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Our Team', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 150, y: 150, width: 120, height: 120, shapeType: 'circle', backgroundColor: textColor + '30' },
            { id: `el-${Date.now()}-3`, type: 'text', x: 130, y: 290, width: 160, height: 30, content: 'Name 1', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 130, y: 320, width: 160, height: 25, content: 'Role', fontSize: 14, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 420, y: 150, width: 120, height: 120, shapeType: 'circle', backgroundColor: textColor + '30' },
            { id: `el-${Date.now()}-6`, type: 'text', x: 400, y: 290, width: 160, height: 30, content: 'Name 2', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 400, y: 320, width: 160, height: 25, content: 'Role', fontSize: 14, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-8`, type: 'shape', x: 690, y: 150, width: 120, height: 120, shapeType: 'circle', backgroundColor: textColor + '30' },
            { id: `el-${Date.now()}-9`, type: 'text', x: 670, y: 290, width: 160, height: 30, content: 'Name 3', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-10`, type: 'text', x: 670, y: 320, width: 160, height: 25, content: 'Role', fontSize: 14, textAlign: 'center', color: textColor }
          );
          break;
        case 'stats':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Key Statistics', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 60, y: 180, width: 200, height: 80, content: '100+', fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 60, y: 260, width: 200, height: 30, content: 'Projects', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 280, y: 180, width: 200, height: 80, content: '50K', fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-5`, type: 'text', x: 280, y: 260, width: 200, height: 30, content: 'Users', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-6`, type: 'text', x: 500, y: 180, width: 200, height: 80, content: '99%', fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 500, y: 260, width: 200, height: 30, content: 'Satisfaction', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-8`, type: 'text', x: 720, y: 180, width: 200, height: 80, content: '24/7', fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-9`, type: 'text', x: 720, y: 260, width: 200, height: 30, content: 'Support', fontSize: 16, textAlign: 'center', color: textColor }
          );
          break;
        case 'features':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Features', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 100, y: 130, width: 240, height: 160, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 12 },
            { id: `el-${Date.now()}-3`, type: 'text', x: 100, y: 220, width: 240, height: 30, content: 'Feature 1', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 360, y: 130, width: 240, height: 160, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 12 },
            { id: `el-${Date.now()}-5`, type: 'text', x: 360, y: 220, width: 240, height: 30, content: 'Feature 2', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 620, y: 130, width: 240, height: 160, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 12 },
            { id: `el-${Date.now()}-7`, type: 'text', x: 620, y: 220, width: 240, height: 30, content: 'Feature 3', fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: textColor }
          );
          break;
        case 'quote':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 100, y: 100, width: 100, height: 100, content: '"', fontSize: 120, fontWeight: 'bold', textAlign: 'left', color: textColor + '30' },
            { id: `el-${Date.now()}-2`, type: 'text', x: 120, y: 200, width: 720, height: 100, content: 'Your inspiring quote goes here...', fontSize: 28, fontWeight: 'normal', textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 120, y: 320, width: 720, height: 40, content: '— Author Name', fontSize: 18, textAlign: 'left', color: textColor + '80' }
          );
          break;
        case 'thankyou':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 180, width: 800, height: 100, content: 'Thank You!', fontSize: 64, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 80, y: 300, width: 800, height: 40, content: 'Questions?', fontSize: 24, textAlign: 'center', color: textColor + '80' }
          );
          break;
        case 'contact':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 60, width: 800, height: 50, content: 'Contact Us', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'text', x: 100, y: 160, width: 400, height: 30, content: '📧 email@example.com', fontSize: 20, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 100, y: 210, width: 400, height: 30, content: '📱 +1 234 567 890', fontSize: 20, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 100, y: 260, width: 400, height: 30, content: '📍 123 Street, City', fontSize: 20, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-5`, type: 'text', x: 100, y: 310, width: 400, height: 30, content: '🌐 www.website.com', fontSize: 20, textAlign: 'left', color: textColor }
          );
          break;
        case 'process':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Our Process', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 100, y: 180, width: 60, height: 60, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 100, y: 190, width: 60, height: 40, content: '1', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 70, y: 260, width: 120, height: 30, content: 'Step 1', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 160, y: 205, width: 120, height: 4, shapeType: 'line', backgroundColor: textColor + '50' },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 300, y: 180, width: 60, height: 60, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 300, y: 190, width: 60, height: 40, content: '2', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-8`, type: 'text', x: 270, y: 260, width: 120, height: 30, content: 'Step 2', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-9`, type: 'shape', x: 360, y: 205, width: 120, height: 4, shapeType: 'line', backgroundColor: textColor + '50' },
            { id: `el-${Date.now()}-10`, type: 'shape', x: 500, y: 180, width: 60, height: 60, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-11`, type: 'text', x: 500, y: 190, width: 60, height: 40, content: '3', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-12`, type: 'text', x: 470, y: 260, width: 120, height: 30, content: 'Step 3', fontSize: 16, textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-13`, type: 'shape', x: 560, y: 205, width: 120, height: 4, shapeType: 'line', backgroundColor: textColor + '50' },
            { id: `el-${Date.now()}-14`, type: 'shape', x: 700, y: 180, width: 60, height: 60, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-15`, type: 'text', x: 700, y: 190, width: 60, height: 40, content: '4', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-16`, type: 'text', x: 670, y: 260, width: 120, height: 30, content: 'Step 4', fontSize: 16, textAlign: 'center', color: textColor }
          );
          break;
        case 'image':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 60, y: 40, width: 400, height: 50, content: 'Image Title', fontSize: 32, fontWeight: 'bold', textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 500, y: 40, width: 400, height: 400, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 12 },
            { id: `el-${Date.now()}-3`, type: 'text', x: 60, y: 120, width: 400, height: 300, content: 'Add your description here. This layout is perfect for showcasing images with accompanying text.', fontSize: 18, textAlign: 'left', color: textColor }
          );
          break;
        case 'chart':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 40, width: 800, height: 50, content: 'Data & Statistics', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 100, y: 400, width: 80, height: 120, shapeType: 'rectangle', backgroundColor: textColor, borderRadius: 4 },
            { id: `el-${Date.now()}-3`, type: 'shape', x: 220, y: 320, width: 80, height: 200, shapeType: 'rectangle', backgroundColor: textColor, borderRadius: 4 },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 340, y: 250, width: 80, height: 270, shapeType: 'rectangle', backgroundColor: textColor, borderRadius: 4 },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 460, y: 180, width: 80, height: 340, shapeType: 'rectangle', backgroundColor: textColor, borderRadius: 4 },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 580, y: 280, width: 80, height: 240, shapeType: 'rectangle', backgroundColor: textColor + '80', borderRadius: 4 },
            { id: `el-${Date.now()}-7`, type: 'shape', x: 700, y: 350, width: 80, height: 170, shapeType: 'rectangle', backgroundColor: textColor + '80', borderRadius: 4 }
          );
          break;
        case 'agenda':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 60, y: 40, width: 840, height: 50, content: 'Agenda', fontSize: 36, fontWeight: 'bold', textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 60, y: 120, width: 40, height: 40, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-3`, type: 'text', x: 120, y: 125, width: 700, height: 35, content: '1. Introduction', fontSize: 22, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 60, y: 190, width: 40, height: 40, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-5`, type: 'text', x: 120, y: 195, width: 700, height: 35, content: '2. Main Topic', fontSize: 22, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 60, y: 260, width: 40, height: 40, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 120, y: 265, width: 700, height: 35, content: '3. Discussion', fontSize: 22, textAlign: 'left', color: textColor },
            { id: `el-${Date.now()}-8`, type: 'shape', x: 60, y: 330, width: 40, height: 40, shapeType: 'circle', backgroundColor: textColor },
            { id: `el-${Date.now()}-9`, type: 'text', x: 120, y: 335, width: 700, height: 35, content: '4. Q&A', fontSize: 22, textAlign: 'left', color: textColor }
          );
          break;
        case 'pricing':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 30, width: 800, height: 50, content: 'Pricing Plans', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 60, y: 100, width: 260, height: 380, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 16 },
            { id: `el-${Date.now()}-3`, type: 'text', x: 60, y: 120, width: 260, height: 40, content: 'Basic', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-4`, type: 'text', x: 60, y: 170, width: 260, height: 50, content: '$29/mo', fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 350, y: 100, width: 260, height: 380, shapeType: 'rectangle', backgroundColor: textColor, borderRadius: 16 },
            { id: `el-${Date.now()}-6`, type: 'text', x: 350, y: 120, width: 260, height: 40, content: 'Pro', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-7`, type: 'text', x: 350, y: 170, width: 260, height: 50, content: '$59/mo', fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: activeSlide.backgroundColor },
            { id: `el-${Date.now()}-8`, type: 'shape', x: 640, y: 100, width: 260, height: 380, shapeType: 'rectangle', backgroundColor: textColor + '10', borderRadius: 16 },
            { id: `el-${Date.now()}-9`, type: 'text', x: 640, y: 120, width: 260, height: 40, content: 'Enterprise', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-10`, type: 'text', x: 640, y: 170, width: 260, height: 50, content: '$99/mo', fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: textColor }
          );
          break;
        case 'gallery':
          baseElements.push(
            { id: `el-${Date.now()}-1`, type: 'text', x: 80, y: 30, width: 800, height: 50, content: 'Gallery', fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: textColor },
            { id: `el-${Date.now()}-2`, type: 'shape', x: 60, y: 100, width: 280, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 },
            { id: `el-${Date.now()}-3`, type: 'shape', x: 350, y: 100, width: 280, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 },
            { id: `el-${Date.now()}-4`, type: 'shape', x: 640, y: 100, width: 260, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 },
            { id: `el-${Date.now()}-5`, type: 'shape', x: 60, y: 300, width: 280, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 },
            { id: `el-${Date.now()}-6`, type: 'shape', x: 350, y: 300, width: 280, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 },
            { id: `el-${Date.now()}-7`, type: 'shape', x: 640, y: 300, width: 260, height: 180, shapeType: 'rectangle', backgroundColor: textColor + '15', borderRadius: 8 }
          );
          break;
        case 'blank':
          // No elements for blank slide
          break;
        default:
          break;
      }
      return baseElements;
    };

    const newElements = generateDefaultElements(type);
    updateSlide({ type, elements: newElements });
  }, [updateSlide, activeSlide]);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Manual save to localStorage (NO DEBOUNCING - NO RATE LIMIT)
  const handleSave = useCallback(async () => {
    if (!autosaveKey) return;
    
    setIsSaving(true);
    try {
      const dataToSave = JSON.stringify({
        slides,
        speakerNotes,
        slideTransitions,
        canvasWidth,
        canvasHeight,
      });
      savePresentation({
        id: autosaveKey,
        userId: user?.id || 0,
        title: presentationTitle,
        slideCount: slides.length,
        data: dataToSave,
      });
      setLastSaved(new Date());
      toast.success(language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(language === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [autosaveKey, user, presentationTitle, slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight, language]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!isInitialized || !autosaveKey || !user) return;
    const interval = setInterval(() => {
      savePresentation({
        id: autosaveKey,
        userId: user.id,
        title: presentationTitle,
        slideCount: slides.length,
        data: JSON.stringify({ slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight }),
      });
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isInitialized, autosaveKey, user, presentationTitle, slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight]);

  // Save on visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    if (!isInitialized || !autosaveKey || !user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        savePresentation({
          id: autosaveKey,
          userId: user.id,
          title: presentationTitle,
          slideCount: slides.length,
          data: JSON.stringify({ slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight }),
        });
        setLastSaved(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInitialized, autosaveKey, user, presentationTitle, slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!autosaveKey || !user) return;
      savePresentation({
        id: autosaveKey,
        userId: user.id,
        title: presentationTitle,
        slideCount: slides.length,
        data: JSON.stringify({ slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight }),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autosaveKey, user, presentationTitle, slides, speakerNotes, slideTransitions, canvasWidth, canvasHeight]);

  const handleSaveOld = () => {
    // Save functionality removed
    toast.info(language === 'ar' ? 'الحفظ معطل' : 'Save disabled');
  };

  const handleExport = async (format: 'pptx' | 'pdf' | 'images') => {
    // Check export limit
    const limitCheck = await canExport(format);
    if (!limitCheck.allowed) return;

    if (format === 'images') {
      // Open the image export dialog instead of exporting directly
      setIsExportImagesOpen(true);
      return;
    }

    toast.loading(`Exporting as ${format.toUpperCase()}...`);
    try {
      if (format === 'pptx') {
        await exportToPptx(slides, presentationTitle, canvasWidth, canvasHeight, slideTransitions);
        trackAction('export_pptx', autosaveKey, presentationTitle);
      } else if (format === 'pdf') {
        await exportToPdf(slides, presentationTitle, canvasWidth, canvasHeight);
        trackAction('export_pdf', autosaveKey, presentationTitle);
      }
      toast.dismiss();
      toast.success(`Exported as ${format.toUpperCase()}!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleSlideSelect = (index: number) => {
    setActiveSlideIndex(index);
    setSelectedElementId(null);
  };

  const handleCopy = useCallback(() => {
    if (selectedElement) {
      setClipboard({ ...selectedElement });
      toast.success('Element copied!');
    }
  }, [selectedElement]);

  const handlePaste = useCallback(() => {
    if (clipboard) {
      const newElement: SlideElement = {
        ...clipboard,
        id: `element-${Date.now()}`,
        x: clipboard.x + 20,
        y: clipboard.y + 20,
      };
      const currentElements = activeSlide.elements || [];
      updateSlide({ elements: [...currentElements, newElement] });
      setSelectedElementId(newElement.id);
      toast.success('Element pasted!');
    }
  }, [clipboard, activeSlide, updateSlide]);

  const handleDuplicate = useCallback(() => {
    if (selectedElement) {
      const newElement: SlideElement = {
        ...selectedElement,
        id: `element-${Date.now()}`,
        x: selectedElement.x + 20,
        y: selectedElement.y + 20,
      };
      const currentElements = activeSlide.elements || [];
      updateSlide({ elements: [...currentElements, newElement] });
      setSelectedElementId(newElement.id);
      toast.success('Element duplicated!');
    }
  }, [selectedElement, activeSlide, updateSlide]);

  const handleNextSlide = useCallback(() => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
      setSelectedElementId(null);
    }
  }, [activeSlideIndex, slides.length]);

  const handlePrevSlide = useCallback(() => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
      setSelectedElementId(null);
    }
  }, [activeSlideIndex]);

  // Speaker Notes handler
  const handleNotesChange = useCallback((slideId: string, content: string) => {
    setSpeakerNotes(prev => ({
      ...prev,
      [slideId]: {
        content,
        lastModified: new Date(),
      },
    }));
  }, []);

  // Navigate from speaker notes
  const handleNotesNavigate = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (direction === 'next' && activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  }, [activeSlideIndex, slides.length]);

  // Copy/Paste Style handler
  const handlePasteStyle = useCallback((style: CopiedStyle) => {
    if (!selectedElementId || !activeSlide.elements) return;
    
    const updates: Partial<SlideElement> = {};
    if (style.color) updates.color = style.color;
    if (style.backgroundColor) updates.backgroundColor = style.backgroundColor;
    if (style.fontSize) updates.fontSize = style.fontSize;
    if (style.fontWeight) updates.fontWeight = style.fontWeight;
    if (style.textAlign) updates.textAlign = style.textAlign;
    if (style.borderRadius) updates.borderRadius = style.borderRadius;
    
    handleUpdateElement(updates);
  }, [selectedElementId, activeSlide, handleUpdateElement]);

  // Smart Layout handler
  const handleApplyLayout = useCallback((newElements: SlideElement[]) => {
    updateSlide({ elements: newElements });
  }, [updateSlide]);

  // Import PPTX handler
  const handleImportPPTX = useCallback((importedSlides: SlideTemplate[], title: string, size?: { width: number; height: number }) => {
    setSlides(importedSlides);
    setPresentationTitle(title);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
    // Match the canvas to the imported file's real size so everything stays in place
    if (size && size.width > 0 && size.height > 0) {
      setCanvasWidth(size.width);
      setCanvasHeight(size.height);
    }
    toast.success(`Imported ${importedSlides.length} slides!`);
  }, []);

  // Canvas size change handler
  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    setCanvasWidth(width);
    setCanvasHeight(height);
    toast.success(`Slide size changed to ${width}×${height}`);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onDelete: handleDeleteElement,
    onDuplicate: handleDuplicate,
    onDeselect: () => {
      setSelectedElementId(null);
      setSelectedElementIds([]);
    },
    onAddSlide: handleAddSlide,
    onNextSlide: handleNextSlide,
    onPrevSlide: handlePrevSlide,
    onPreview: () => setIsPresentationMode(true),
    onGroup: () => {
      if (selectedElementIds.length > 1) {
        handleGroup(selectedElementIds);
      }
    },
    onUngroup: () => {
      const group = groups.find(g => 
        selectedElementIds.every(id => g.elementIds.includes(id))
      );
      if (group) {
        handleUngroup(group.id);
      }
    },
    onZoomIn: () => setZoom(prev => Math.min(300, prev + 25)),
    onZoomOut: () => setZoom(prev => Math.max(25, prev - 25)),
    onZoomReset: () => setZoom(100),
    enabled: !isPresentationMode,
  });

  // Autosave props for toolbar
  const autosaveProps = useMemo(() => ({
    lastSaved: lastSaved,
    isSaving: isSaving,
    hasUnsavedChanges: false,
    error: null,
    isEnabled: true,
    storageSize: '0 B',
    onToggle: () => {},
    onManualSave: handleSave,
    onClear: () => {},
    onExport: () => '',
    onImport: () => false,
  }), [lastSaved, isSaving, handleSave]);

  if (isPresentationMode) {
    return (
      <PresentationMode
        slides={slides}
        initialSlideIndex={activeSlideIndex}
        onClose={() => setIsPresentationMode(false)}
        speakerNotes={speakerNotes}
        slideTransitions={slideTransitions}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Version History Dialog */}
      <VersionHistory
        presentationId={autosaveKey}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestore={reloadPresentation}
      />

      {/* Activity Panel */}
      <ActivityPanel
        presentationId={autosaveKey}
        open={showActivityPanel}
        onOpenChange={setShowActivityPanel}
      />

      {/* Preview Mode Dialog */}
      <PreviewMode
        isOpen={isPreviewMode}
        onClose={() => setIsPreviewMode(false)}
        slides={slides}
        currentSlideIndex={activeSlideIndex}
        onSlideChange={setActiveSlideIndex}
        notes={speakerNotes}
        slideTransitions={slideTransitions}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onStartPresentation={() => {
          setIsPreviewMode(false);
          setIsPresentationMode(true);
        }}
      />

      {/* Export Images Dialog */}
      <ExportImagesDialog
        isOpen={isExportImagesOpen}
        onClose={() => setIsExportImagesOpen(false)}
        slides={slides}
        presentationTitle={presentationTitle}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />

      {/* Toolbar */}
      <EditorToolbar
        presentationTitle={presentationTitle}
        onTitleChange={setPresentationTitle}
        onSave={handleSave}
        onCreateNew={handleCreateNew}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onExport={handleExport}
        onPreview={() => setIsPreviewMode(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        autosave={autosaveProps}
        elements={activeSlide?.elements || []}
        selectedElementId={selectedElementId}
        onSelectElement={setSelectedElementId}
        onUpdateElement={handleUpdateElementById}
        onDeleteElement={handleDeleteElementById}
        onDuplicateElement={handleDuplicateElementById}
        onReorderElements={handleReorderElements}
        zoom={zoom}
        onZoomChange={setZoom}
        selectedElementIds={selectedElementIds}
        groups={groups}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onAlignSelected={handleAlignSelected}
        onDistributeSelected={handleDistributeSelected}
        onPasteStyle={handlePasteStyle}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onApplyLayout={handleApplyLayout}
        onImportPPTX={handleImportPPTX}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop - closes any open drawer panel */}
        {isMobile && (showSlidesPanel || showPropertiesPanel) && (
          <div
            className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={() => {
              setShowSlidesPanel(false);
              setShowPropertiesPanel(false);
            }}
          />
        )}

        {/* Slides Panel */}
        {isMobile ? (
          <div
            className={`absolute inset-y-0 z-40 w-64 max-w-[85vw] bg-background shadow-2xl border-r border-border/60 transition-transform duration-300 ${
              isRtl ? 'right-0' : 'left-0'
            } ${showSlidesPanel ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}`}
          >
            <div className="h-full overflow-auto">
              <SlidePanel
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                onSlideSelect={(index) => {
                  handleSlideSelect(index);
                  setShowSlidesPanel(false);
                }}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onAddSlide={handleAddSlide}
                onDeleteSlide={handleDeleteSlide}
                onDuplicateSlide={(index) => {
                  const slide = slides[index];
                  const newSlide = {
                    ...slide,
                    id: `slide-${Date.now()}`,
                    elements: slide.elements?.map(el => ({
                      ...el,
                      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    })),
                  };
                  const newSlides = [...slides];
                  newSlides.splice(index + 1, 0, newSlide);
                  setSlides(newSlides);
                  setActiveSlideIndex(index + 1);

                  // Assign random transition to the duplicated slide
                  const randomTransition = getRandomTransition();
                  setSlideTransitions(prev => ({
                    ...prev,
                    [newSlide.id]: randomTransition,
                  }));

                  toast.success(language === 'ar' ? 'تم تكرار الشريحة!' : 'Slide duplicated!');
                }}
                onMoveSlide={(fromIndex, toIndex) => {
                  const newSlides = [...slides];
                  const [movedSlide] = newSlides.splice(fromIndex, 1);
                  newSlides.splice(toIndex, 0, movedSlide);
                  setSlides(newSlides);
                  setActiveSlideIndex(toIndex);
                }}
                slideTransitions={slideTransitions}
                onTransitionChange={(slideId, transition) => {
                  setSlideTransitions(prev => ({
                    ...prev,
                    [slideId]: transition,
                  }));
                }}
                activeSlide={activeSlide}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElementById}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onReorderElements={(elements) => updateSlide({ elements })}
              />
            </div>
          </div>
        ) : (
          <div
            className={`relative transition-all duration-300 ease-in-out overflow-visible ${
              showSlidesPanel ? 'w-52' : 'w-0'
            }`}
          >
            <div className={`h-full overflow-auto ${showSlidesPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <SlidePanel
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                onSlideSelect={handleSlideSelect}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onAddSlide={handleAddSlide}
                onDeleteSlide={handleDeleteSlide}
                onDuplicateSlide={(index) => {
                  const slide = slides[index];
                  const newSlide = {
                    ...slide,
                    id: `slide-${Date.now()}`,
                    elements: slide.elements?.map(el => ({
                      ...el,
                      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    })),
                  };
                  const newSlides = [...slides];
                  newSlides.splice(index + 1, 0, newSlide);
                  setSlides(newSlides);
                  setActiveSlideIndex(index + 1);

                  // Assign random transition to the duplicated slide
                  const randomTransition = getRandomTransition();
                  setSlideTransitions(prev => ({
                    ...prev,
                    [newSlide.id]: randomTransition,
                  }));

                  toast.success(language === 'ar' ? 'تم تكرار الشريحة!' : 'Slide duplicated!');
                }}
                onMoveSlide={(fromIndex, toIndex) => {
                  const newSlides = [...slides];
                  const [movedSlide] = newSlides.splice(fromIndex, 1);
                  newSlides.splice(toIndex, 0, movedSlide);
                  setSlides(newSlides);
                  setActiveSlideIndex(toIndex);
                }}
                slideTransitions={slideTransitions}
                onTransitionChange={(slideId, transition) => {
                  setSlideTransitions(prev => ({
                    ...prev,
                    [slideId]: transition,
                  }));
                }}
                activeSlide={activeSlide}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElementById}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onReorderElements={(elements) => updateSlide({ elements })}
              />
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden min-w-0">
          <SlideCanvas
            slide={activeSlide}
            onTitleChange={(title) => updateSlide({ title })}
            onSubtitleChange={(subtitle) => updateSlide({ subtitle })}
            onContentChange={(content) => updateSlide({ content })}
            onElementsChange={(elements) => updateSlide({ elements })}
            selectedElementId={selectedElementId}
            selectedElementIds={selectedElementIds}
            onSelectElement={setSelectedElementId}
            onSelectElements={setSelectedElementIds}
            zoom={zoom}
            onZoomChange={setZoom}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            showRulers={showRulers}
            showGuides={showGuides}
            onToggleRulers={() => setShowRulers(v => !v)}
            onToggleGuides={() => setShowGuides(v => !v)}
            showSlidesPanel={showSlidesPanel}
            showPropertiesPanel={showPropertiesPanel}
            onToggleSlidesPanel={() => setShowSlidesPanel(!showSlidesPanel)}
            onTogglePropertiesPanel={() => setShowPropertiesPanel(!showPropertiesPanel)}
          />
        </div>

        {/* Properties Panel */}
        {isMobile ? (
          <div
            className={`absolute inset-y-0 z-40 w-72 max-w-[90vw] bg-background shadow-2xl border-l border-border/60 transition-transform duration-300 ${
              isRtl ? 'left-0' : 'right-0'
            } ${showPropertiesPanel ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full'}`}
          >
            <div className="h-full overflow-auto">
              <PropertiesPanel
                slide={activeSlide}
                selectedElement={selectedElement}
                onBackgroundColorChange={(backgroundColor) => updateSlide({ backgroundColor })}
                onTextColorChange={(textColor) => updateSlide({ textColor })}
                onAddElement={handleAddElement}
                onAddElements={handleAddElements}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onSlideTypeChange={handleSlideTypeChange}
                slideIndex={activeSlideIndex}
                totalSlides={slides.length}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                zoom={zoom}
                onZoomChange={setZoom}
                onCanvasSizeChange={handleCanvasSizeChange}
                onDuplicateSlide={handleDuplicateSlide}
                onDeleteSlide={handleDeleteCurrentSlide}
                onMoveSlide={handleMoveSlide}
                elements={activeSlide.elements || []}
                onUpdateElementById={handleUpdateElementById}
                slideTransition={slideTransitions[activeSlide.id]}
                onSlideTransitionChange={(transition) => {
                  setSlideTransitions(prev => ({
                    ...prev,
                    [activeSlide.id]: transition,
                  }));
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className={`relative transition-all duration-300 ease-in-out overflow-visible ${
              showPropertiesPanel ? 'w-64' : 'w-0'
            }`}
          >
            <div className={`h-full overflow-auto ${showPropertiesPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <PropertiesPanel
                slide={activeSlide}
                selectedElement={selectedElement}
                onBackgroundColorChange={(backgroundColor) => updateSlide({ backgroundColor })}
                onTextColorChange={(textColor) => updateSlide({ textColor })}
                onAddElement={handleAddElement}
                onAddElements={handleAddElements}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onSlideTypeChange={handleSlideTypeChange}
                slideIndex={activeSlideIndex}
                totalSlides={slides.length}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                zoom={zoom}
                onZoomChange={setZoom}
                onCanvasSizeChange={handleCanvasSizeChange}
                onDuplicateSlide={handleDuplicateSlide}
                onDeleteSlide={handleDeleteCurrentSlide}
                onMoveSlide={handleMoveSlide}
                elements={activeSlide.elements || []}
                onUpdateElementById={handleUpdateElementById}
                slideTransition={slideTransitions[activeSlide.id]}
                onSlideTransitionChange={(transition) => {
                  setSlideTransitions(prev => ({
                    ...prev,
                    [activeSlide.id]: transition,
                  }));
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Speaker Notes - Bottom Bar */}
      {isMobile ? (
        <div className="h-auto border-t border-border bg-card flex flex-col">
          {/* Unified Bar: Notes + Panel Toggles + Navigation + Quick Add */}
          <div className="flex items-center justify-between px-2 py-2 bg-muted/30">
            <div className="flex items-center gap-1">
              <SpeakerNotes
                slideId={activeSlide?.id || ''}
                slideIndex={activeSlideIndex}
                totalSlides={slides.length}
                notes={speakerNotes}
                onNotesChange={handleNotesChange}
                onNavigate={handleNotesNavigate}
              />
              <div className="w-px h-5 bg-border/50 mx-1" />
              <button
                onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                className={`flex flex-col items-center gap-0 p-1 rounded-lg transition-all min-w-[32px] ${
                  showPropertiesPanel
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted/80'
                }`}
                title={language === 'ar' ? 'الخصائص' : 'Properties'}
              >
                <PanelRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowSlidesPanel(!showSlidesPanel)}
                className={`flex flex-col items-center gap-0 p-1 rounded-lg transition-all min-w-[32px] ${
                  showSlidesPanel
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted/80'
                }`}
                title={language === 'ar' ? 'الشرائح' : 'Slides'}
              >
                <PanelLeft className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1 rounded-lg hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="text-[10px] font-medium min-w-[50px] text-center">
                {activeSlideIndex + 1} / {slides.length}
              </div>
              <button
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1 rounded-lg hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleAddElement({
                  type: 'text',
                  x: 100,
                  y: 100,
                  width: 300,
                  height: 80,
                  content: language === 'ar' ? 'نص جديد' : 'New Text',
                  fontSize: 20,
                  fontWeight: 'normal',
                  textAlign: 'left',
                  color: activeSlide.textColor,
                })}
                className="flex flex-col items-center gap-0 p-1 rounded-lg hover:bg-background transition-colors min-w-[32px]"
                title={language === 'ar' ? 'إضافة نص' : 'Add Text'}
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleAddElement({
                  type: 'shape',
                  x: 150,
                  y: 150,
                  width: 100,
                  height: 100,
                  shapeType: 'rectangle',
                  backgroundColor: '#3b82f6',
                  borderRadius: 8,
                })}
                className="flex flex-col items-center gap-0 p-1 rounded-lg hover:bg-background transition-colors min-w-[32px]"
                title={language === 'ar' ? 'إضافة مستطيل' : 'Add Rectangle'}
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleAddElement({
                  type: 'shape',
                  x: 150,
                  y: 150,
                  width: 100,
                  height: 100,
                  shapeType: 'circle',
                  backgroundColor: '#3b82f6',
                  borderRadius: 50,
                })}
                className="flex flex-col items-center gap-0 p-1 rounded-lg hover:bg-background transition-colors min-w-[32px]"
                title={language === 'ar' ? 'إضافة دائرة' : 'Add Circle'}
              >
                <Circle className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-12 border-t border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SpeakerNotes
              slideId={activeSlide?.id || ''}
              slideIndex={activeSlideIndex}
              totalSlides={slides.length}
              notes={speakerNotes}
              onNotesChange={handleNotesChange}
              onNavigate={handleNotesNavigate}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {activeSlideIndex + 1} / {slides.length}
          </div>
        </div>
      )}

      {/* Presentation Name Dialog */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              {isCreatingNew 
                ? (language === 'ar' ? 'إنشاء عرض جديد' : 'Create New Presentation')
                : (language === 'ar' ? 'اسم العرض التقديمي' : 'Presentation Name')
              }
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              {isCreatingNew
                ? (language === 'ar' ? 'سيتم حفظ العرض الحالي تلقائياً' : 'Current presentation will be saved automatically')
                : (language === 'ar' ? 'أدخل اسماً لعرضك التقديمي الجديد' : 'Enter a name for your new presentation')
              }
            </p>
            <input
              type="text"
              value={tempPresentationName}
              onChange={(e) => setTempPresentationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePresentationNameSubmit();
                }
              }}
              placeholder={language === 'ar' ? 'مثال: عرض تقديمي للمشروع' : 'e.g., Project Presentation'}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isCreatingNew) {
                    setShowNameDialog(false);
                    setIsCreatingNew(false);
                    setTempPresentationName('');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handlePresentationNameSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                {language === 'ar' ? 'إنشاء' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
