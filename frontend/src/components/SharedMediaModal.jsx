import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { X, Image as ImageIcon } from 'lucide-react';

const SharedMediaModal = ({ isOpen, onClose }) => {
  const { selectedUser, sharedMediaConversation, getSharedMediaConversation, isMediaLoading } = useChatStore();

  useEffect(() => {
    if (isOpen && selectedUser) {
      getSharedMediaConversation(selectedUser.id);
    }
  }, [isOpen, selectedUser, getSharedMediaConversation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-base-100 w-full max-w-2xl h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" />
            Shared Media with {selectedUser?.name || 'User'}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-base-100">
          {isMediaLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : sharedMediaConversation.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-base-content/50 gap-4">
              <ImageIcon size={48} className="opacity-20" />
              <p>No media shared in this conversation yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sharedMediaConversation.map((msg) => (
                <div key={msg.id} className="aspect-square bg-base-200 rounded-lg overflow-hidden group relative">
                  <img 
                    src={msg.image} 
                    alt="Shared media" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedMediaModal;
