import { useCallback } from 'react';

export const useEditorTracking = () => {
  const trackAction = useCallback(async (
    _actionType: string,
    _presentationId?: string,
    _details?: string
  ) => {
    // No-op - frontend only
  }, []);

  const trackSlideChange = useCallback(async (
    _presentationId: string,
    _slideId: string,
    _changeType: string,
    _elementId?: string,
    _elementType?: string,
    _oldValue?: any,
    _newValue?: any
  ) => {
    // No-op - frontend only
  }, []);

  const trackTemplateUsage = useCallback(async (
    _templateId: string,
    _templateName: string,
    _action: string,
    _presentationId?: string
  ) => {
    // No-op - frontend only
  }, []);

  return { trackAction, trackSlideChange, trackTemplateUsage };
};
