import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
}

interface SlideCommentsProps {
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  onDeleteComment: (id: string) => void;
  onResolveComment: (id: string) => void;
  canvasScale: number;
  currentUser?: string;
}

export const SlideComments = ({
  comments,
  onAddComment,
  onDeleteComment,
  onResolveComment,
  canvasScale,
  currentUser = 'User',
}: SlideCommentsProps) => {
  const { language } = useLanguage();
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isAddingComment) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasScale;
    const y = (e.clientY - rect.top) / canvasScale;
    
    setNewCommentPos({ x, y });
  }, [isAddingComment, canvasScale]);

  const handleSubmitComment = useCallback(() => {
    if (!newCommentPos || !newCommentText.trim()) return;
    
    onAddComment({
      x: newCommentPos.x,
      y: newCommentPos.y,
      text: newCommentText.trim(),
      author: currentUser,
    });
    
    setNewCommentText('');
    setNewCommentPos(null);
    setIsAddingComment(false);
  }, [newCommentPos, newCommentText, currentUser, onAddComment]);

  const handleCancelComment = useCallback(() => {
    setNewCommentText('');
    setNewCommentPos(null);
    setIsAddingComment(false);
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant={isAddingComment ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsAddingComment(!isAddingComment)}
        className="gap-2"
      >
        <MessageCircle size={16} />
        {language === 'ar' ? 'تعليق' : 'Comment'}
      </Button>

      {/* Comment Markers */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={cn(
            'absolute w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
            comment.resolved ? 'bg-green-500' : 'bg-primary'
          )}
          style={{
            left: comment.x * canvasScale - 12,
            top: comment.y * canvasScale - 12,
            zIndex: 50,
          }}
          onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
        >
          <MessageCircle size={14} className="text-white" />
        </div>
      ))}

      {/* Active Comment Popup */}
      {activeCommentId && (
        <div
          className="absolute bg-background border rounded-lg shadow-lg p-3 w-64 z-[60]"
          style={{
            left: (comments.find(c => c.id === activeCommentId)?.x || 0) * canvasScale + 20,
            top: (comments.find(c => c.id === activeCommentId)?.y || 0) * canvasScale - 10,
          }}
        >
          {(() => {
            const comment = comments.find(c => c.id === activeCommentId);
            if (!comment) return null;
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{comment.author}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        comment.resolved ? 'bg-green-100 text-green-700' : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {comment.resolved ? '✓' : (language === 'ar' ? 'حل' : 'Resolve')}
                    </button>
                    <button
                      onClick={() => { onDeleteComment(comment.id); setActiveCommentId(null); }}
                      className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={() => setActiveCommentId(null)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm">{comment.text}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </>
            );
          })()}
        </div>
      )}

      {/* New Comment Input */}
      {newCommentPos && (
        <div
          className="absolute bg-background border rounded-lg shadow-lg p-3 w-64 z-[60]"
          style={{
            left: newCommentPos.x * canvasScale + 20,
            top: newCommentPos.y * canvasScale - 10,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{language === 'ar' ? 'تعليق جديد' : 'New Comment'}</span>
            <button onClick={handleCancelComment} className="p-1 hover:bg-muted rounded">
              <X size={14} />
            </button>
          </div>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب تعليقك...' : 'Write your comment...'}
            className="w-full h-20 text-sm border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={handleSubmitComment} disabled={!newCommentText.trim()}>
              <Send size={14} className="mr-1" />
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </div>
        </div>
      )}

      {/* Click overlay when adding comment */}
      {isAddingComment && !newCommentPos && (
        <div
          className="absolute inset-0 cursor-crosshair z-40"
          onClick={handleCanvasClick}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
            {language === 'ar' ? 'انقر لإضافة تعليق' : 'Click to add comment'}
          </div>
        </div>
      )}
    </>
  );
};

export default SlideComments;
