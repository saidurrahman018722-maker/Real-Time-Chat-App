import React, { useState } from 'react';
import { Search, X, CheckCircle2, User } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const ShareContactModal = ({ isOpen, onClose, onShare }) => {
  const { contacts } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sharingContactId, setSharingContactId] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((contact) =>
    contact.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShare = async (contact) => {
    setSharingContactId(contact.user.id);
    await onShare(contact.user.id);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSharingContactId(null);
      onClose();
    }, 1000);
  };

  const renderContactItem = (contact) => {
    if (!contact.user) return null;
    const displayName = contact.alias || contact.user.name || 'Unknown';
    
    return (
      <div 
        key={contact.id} 
        className="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition-colors cursor-pointer group border border-transparent hover:border-base-300"
        onClick={() => !sharingContactId && handleShare(contact)}
      >
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
              {contact.user.profilePic ? (
                <img src={contact.user.profilePic} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-base-content/50" />
              )}
            </div>
          </div>
          <div>
            <div className="font-semibold">{displayName}</div>
            {contact.alias && contact.user.name !== contact.alias && (
              <div className="text-xs opacity-50">{contact.user.name}</div>
            )}
          </div>
        </div>
        
        <div>
          {success && sharingContactId === contact.user.id ? (
            <CheckCircle2 size={20} className="text-success animate-in zoom-in" />
          ) : sharingContactId === contact.user.id ? (
            <span className="loading loading-spinner loading-sm text-primary"></span>
          ) : (
            <button className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-primary">
              Share
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <h2 className="text-lg font-bold">Share Contact</h2>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-base-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
            <input
              type="text"
              placeholder="Search your contacts..."
              className="input input-bordered w-full pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredContacts.length > 0 ? (
            <div className="space-y-1">
              {filteredContacts.map(renderContactItem)}
            </div>
          ) : (
            <div className="text-center py-10 text-base-content/50">
              No contacts found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareContactModal;
