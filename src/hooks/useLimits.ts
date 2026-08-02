import { useState, useEffect, useCallback } from 'react';

const DEFAULT_LIMITS = {
  maxSlides: 100,
  maxElements: 50,
  maxPresentations: 50,
  maxExportsPerDay: 10,
};

interface CheckResult {
  allowed: boolean;
  current?: number;
  max?: number;
  message?: string;
  quality?: string;
}

export const useLimits = () => {
  const [isLoading] = useState(false);

  const checkLimit = useCallback(async (
    _action: string,
    _data?: Record<string, any>
  ): Promise<CheckResult> => {
    return { allowed: true };
  }, []);

  const canCreatePresentation = useCallback(() =>
    checkLimit('create_presentation'), [checkLimit]);

  const canAddSlide = useCallback((_presentationId: string) =>
    checkLimit('add_slide'), [checkLimit]);

  const canAddElement = useCallback((_currentElements: number) =>
    checkLimit('add_element'), [checkLimit]);

  const canExport = useCallback((_format: string) =>
    checkLimit('export'), [checkLimit]);

  const canSaveTemplate = useCallback(() =>
    checkLimit('save_template'), [checkLimit]);

  const canUploadFile = useCallback((_filename: string, _size: number) =>
    checkLimit('upload_file'), [checkLimit]);

  const canUseAnimation = useCallback(() =>
    checkLimit('use_animation'), [checkLimit]);

  const quickCheck = {
    isAnimationEnabled: () => true,
    isCustomTemplatesAllowed: () => true,
    getExportQuality: () => 'high',
    getAllowedFileTypes: () => ['png', 'jpg', 'svg', 'gif'],
    getAllowedExportFormats: () => ['pptx', 'pdf', 'images'],
    getInactivityTimeout: () => 30,
    getMaxFileSize: () => 10,
  };

  return {
    limits: DEFAULT_LIMITS,
    usage: { presentations: 0, exports_today: 0, templates: 0, storage_used_mb: 0 },
    isLoading,
    refetch: () => {},
    checkLimit,
    canCreatePresentation,
    canAddSlide,
    canAddElement,
    canExport,
    canSaveTemplate,
    canUploadFile,
    canUseAnimation,
    quickCheck,
  };
};
