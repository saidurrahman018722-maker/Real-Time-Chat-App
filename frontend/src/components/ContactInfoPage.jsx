import React, { useState, useEffect } from 'react';
import { X, MinusCircle, Ban, ThumbsDown, Trash2, Edit2, Check, ImageIcon, ArrowLeft } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const ContactInfoPage = ({ onClose }) => {
  const { selectedUser, clearChat, deleteChat, blockContact, reportContact, updateContactAlias, conversations, getSharedMediaConversation, sharedMediaConversation, isMediaLoading } = useChatStore();
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmBlockOpen, setIsConfirmBlockOpen] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      getSharedMediaConversation(selectedUser.id);
    }
  }, [selectedUser, getSharedMediaConversation]);

  if (!selectedUser) return null;

  // Find if there's a conversation ID for the current selected user
  const conversation = conversations.find(c => c.partner?.id === selectedUser.id);
  const conversationId = conversation?.id;

  const handleEditClick = () => {
    setAliasInput(selectedUser.name);
    setIsEditingAlias(true);
  };

  const handleSaveAlias = () => {
    if (aliasInput.trim() && aliasInput.trim() !== selectedUser.name) {
      updateContactAlias(selectedUser.id, aliasInput.trim());
      // For immediate UI update in the drawer without waiting for global state refresh
      selectedUser.name = aliasInput.trim(); 
    }
    setIsEditingAlias(false);
  };

  const handleClearChat = async () => {
    if (conversationId) {
      await clearChat(conversationId);
      onClose();
    }
  };

  const handleDeleteChat = async () => {
    if (conversationId) {
      await deleteChat(conversationId);
      onClose();
    }
  };

  const handleBlockContact = async () => {
    await blockContact(selectedUser.id);
    setIsConfirmBlockOpen(false);
    onClose();
  };

  const confirmDeleteChat = async () => {
    if (conversationId) {
      await deleteChat(conversationId);
    }
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  const handleReportContact = async () => {
    await reportContact(selectedUser.id);
    onClose();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-base-100 overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center gap-4 bg-base-100/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">Contact Info</h2>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        {/* Profile Info */}
        <div className="flex flex-col items-center p-6 bg-base-200 rounded-2xl shadow-sm mb-6 relative">
          <button 
            onClick={handleEditClick}
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
            title="Edit Contact"
          >
            <Edit2 size={16} />
          </button>
          
          <div className="avatar mb-4">
            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              {selectedUser.profilePic ? (
                <img src={selectedUser.profilePic} alt={selectedUser.name} />
              ) : (
                <div className="w-32 h-32 bg-primary text-primary-content flex items-center justify-center text-4xl font-bold rounded-full">
                  {selectedUser.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          {isEditingAlias ? (
            <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
              <input 
                type="text" 
                className="input input-bordered w-full" 
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
              />
              <button onClick={handleSaveAlias} className="btn btn-primary btn-circle">
                <Check size={20} />
              </button>
            </div>
          ) : (
            <h3 className="text-2xl font-bold mt-2 text-center">{selectedUser.name}</h3>
          )}
          <p className="text-base text-base-content/60 mt-1">{selectedUser.email}</p>
        </div>

        {/* Shared Media Section in the Middle */}
        <div className="bg-base-200 rounded-2xl shadow-sm mb-6 p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" /> Shared Media
          </h3>
          
          {isMediaLoading ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : sharedMediaConversation && sharedMediaConversation.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {sharedMediaConversation.slice(0, 10).map((msg) => (
                <div key={msg.id} className="aspect-square rounded-xl overflow-hidden bg-base-300 shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
                  <img src={msg.image} alt="Shared media" className="w-full h-full object-cover" />
                </div>
              ))}
              {sharedMediaConversation.length > 10 && (
                <div className="col-span-full text-center mt-4">
                  <button className="btn btn-outline btn-sm">
                    View all {sharedMediaConversation.length} media files
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-base-100 rounded-xl border border-base-300 border-dashed">
              <ImageIcon size={32} className="mx-auto text-base-content/30 mb-2" />
              <p className="text-sm text-base-content/50">No media shared yet</p>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="bg-base-200 rounded-2xl shadow-sm p-2">
          <button 
            onClick={handleClearChat}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-base-100 text-error transition-all"
          >
            <div className="bg-error/10 p-2 rounded-lg"><MinusCircle size={24} /></div>
            <span className="font-medium text-lg">Clear chat</span>
          </button>
          
          <button 
            onClick={() => setIsConfirmBlockOpen(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-base-100 text-error transition-all"
          >
            <div className="bg-error/10 p-2 rounded-lg"><Ban size={24} /></div>
            <span className="font-medium text-lg">Block {selectedUser.name}</span>
          </button>
          
          <button 
            onClick={handleReportContact}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-base-100 text-error transition-all"
          >
            <div className="bg-error/10 p-2 rounded-lg"><ThumbsDown size={24} /></div>
            <span className="font-medium text-lg">Report {selectedUser.name}</span>
          </button>
          
          <button 
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-base-100 text-error transition-all"
          >
            <div className="bg-error/10 p-2 rounded-lg"><Trash2 size={24} /></div>
            <span className="font-medium text-lg">Delete chat</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsConfirmDeleteOpen(false)}>
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl max-w-sm w-full m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">Delete chat?</h3>
            <p className="text-base-content/70 mb-6">Are you sure you want to delete the entire chat history with {selectedUser.name}? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</button>
              <button className="btn btn-error" onClick={confirmDeleteChat}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isConfirmBlockOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsConfirmBlockOpen(false)}>
          <div className="bg-[#2a2d32] text-white p-6 rounded-2xl shadow-xl max-w-md w-full m-4 border border-white/5" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4">Block {selectedUser.name}?</h3>
            <p className="text-[#a0a4a8] text-sm mb-6 leading-relaxed">
              This person won't be able to message or call you. They won't know you blocked or reported them.
            </p>
            
            <div className="flex gap-3 items-start mb-8">
              <input type="checkbox" className="checkbox checkbox-sm mt-1 rounded border-[#5e6369] checked:bg-[#00a884] checked:border-[#00a884]" />
              <div>
                <span className="font-medium text-sm block">Report user</span>
                <span className="text-[#a0a4a8] text-sm block mt-1">
                  The last 5 messages from this user will be sent for review.{' '}
                  <a href="#" className="text-[#00a884] hover:underline">Learn more</a>
                </span>
              </div>
            </div>

            <div className="flex gap-4 justify-end items-center">
              <button className="text-[#00a884] font-medium hover:bg-white/5 px-4 py-2 rounded-full transition-colors" onClick={() => setIsConfirmBlockOpen(false)}>Cancel</button>
              <button className="bg-[#ff4b5c] text-white font-medium px-6 py-2 rounded-full hover:bg-[#ff3347] transition-colors" onClick={handleBlockContact}>Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfoPage;
