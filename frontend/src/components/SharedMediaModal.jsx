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
    <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-base-100 w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl shadow-xl animate-slide-up m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10 rounded-t-2xl">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" /> Shared Media
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isMediaLoading ? (
            <div className="text-center p-8"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : sharedMediaConversation.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sharedMediaConversation.map((msg) => (
                <div key={msg.id} className="aspect-square bg-base-200 rounded-xl flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity cursor-pointer shadow-sm border border-base-300 relative group">
                  <img src={msg.image} alt="Shared media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-base-300 rounded-xl text-base-content/50 mt-10">
              No media shared in this conversation yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedMediaModal;
