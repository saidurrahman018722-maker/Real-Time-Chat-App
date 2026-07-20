import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Plus, X, Copy, Link, Download, Pin, MessageSquare, Forward, CheckSquare, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageContextMenu = ({ 
  x, y, message, isMine, onClose, onReact, 
  onCopyText, onCopyMediaLink, onDownloadMedia, 
  onPin, onReply, onForward, onSelect, onDeleteMe, onDeleteEveryone 
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !showFullPicker) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showFullPicker]);

  const isRightSide = isMine;
  
  // Safe Y calculation (prevent overflowing bottom)
  const safeY = Math.max(10, Math.min(y, window.innerHeight - 450));
  
  // Safe horizontal calculation to prevent going off-screen (assuming menu is max ~290px wide)
  const safeLeft = Math.min(window.innerWidth - 290, Math.max(10, x));
  const safeRight = Math.min(window.innerWidth - 290, Math.max(10, window.innerWidth - x));

  const style = isRightSide 
    ? { top: safeY, right: safeRight }
    : { top: safeY, left: safeLeft };

  const containerClass = `fixed z-[100] flex flex-col gap-2 animate-scale-in ${isRightSide ? 'items-end' : 'items-start'}`;

  const mediaUrl = message.image || message.video || message.audio || message.document;

  return (
    <>
      <div 
        ref={menuRef} 
        className={containerClass}
        style={style}
      >
        {/* Emoji Pill */}
        <div className="bg-base-200 border border-base-300 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1 w-max">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="hover:scale-125 hover:-translate-y-1 transition-transform p-1 text-xl leading-none"
              onClick={(e) => { e.stopPropagation(); onReact(emoji); onClose(); }}
            >
              {emoji}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-base-300 mx-1" />
          <button
            className="btn btn-ghost btn-xs btn-circle bg-base-300 hover:bg-base-content/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowFullPicker(true); }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Options Menu */}
        <div className="bg-base-200 shadow-xl border border-base-300 rounded-xl py-1 min-w-[200px]">
          {message.text && (
            <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onCopyText(); onClose(); }}>
              <Copy size={16} className="opacity-70" /> Copy text
            </button>
          )}

          {mediaUrl && (
            <>
              <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onCopyMediaLink(mediaUrl); onClose(); }}>
                <Link size={16} className="opacity-70" /> Copy media link
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onDownloadMedia(mediaUrl); onClose(); }}>
                <Download size={16} className="opacity-70" /> Download media
              </button>
            </>
          )}

          <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onPin(); onClose(); }}>
            <Pin size={16} className={message.isPinned ? 'fill-current opacity-70' : 'opacity-70'} /> 
            {message.isPinned ? 'Unpin message' : 'Pin message'}
          </button>

          <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onReply(); onClose(); }}>
            <MessageSquare size={16} className="opacity-70" /> Reply
          </button>
          
          <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onForward(); onClose(); }}>
            <Forward size={16} className="opacity-70" /> Forward
          </button>

          <div className="my-1 border-t border-base-300 mx-2" />
          
          <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-base-content/90 transition-colors" onClick={(e) => { e.stopPropagation(); onSelect(); onClose(); }}>
            <CheckSquare size={16} className="opacity-70" /> Select
          </button>

          <div className="my-1 border-t border-base-300 mx-2" />

          <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-error transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteMe(); onClose(); }}>
            <Trash size={16} /> Delete for me
          </button>

          {isMine && (
            <button className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center gap-3 font-medium text-error transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteEveryone(); onClose(); }}>
              <Trash size={16} /> Delete for everyone
            </button>
          )}
        </div>
      </div>

      {showFullPicker && createPortal(
        <div className="fixed inset-0 z-[110] flex justify-center items-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <div className="relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 btn btn-circle btn-ghost text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X size={24} />
            </button>
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onReact(emojiData.emoji);
                onClose();
              }}
              theme="dark"
              lazyLoadEmojis={true}
              searchDisabled={false}
              skinTonesDisabled={true}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MessageContextMenu;
