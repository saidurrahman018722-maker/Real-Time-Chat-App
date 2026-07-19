import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Search, X, CheckCircle2 } from 'lucide-react';

const ForwardMessageModal = ({ isOpen, onClose, messageIds }) => {
  const { contacts, conversations, forwardMessages } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [forwardingTo, setForwardingTo] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((contact) =>
    contact.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentChats = conversations.slice(0, 5).map(conv => conv.partner);

  const handleForward = async (userId) => {
    setForwardingTo(userId);
    const result = await forwardMessages(messageIds, userId);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForwardingTo(null);
        onClose();
      }, 1000);
    } else {
      setForwardingTo(null);
    }
  };

  const renderUserItem = (user, alias = null) => {
    const displayName = alias || user.name;
    return (
      <div 
        key={user.id} 
        className="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition-colors cursor-pointer group"
        onClick={() => !forwardingTo && handleForward(user.id)}
      >
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} />
              ) : (
                <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-lg font-semibold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-xs text-base-content/60">{user.email}</p>
          </div>
        </div>
        
        {forwardingTo === user.id ? (
          <span className="loading loading-spinner loading-sm text-primary"></span>
        ) : success && forwardingTo === user.id ? (
          <CheckCircle2 className="text-success" size={20} />
        ) : (
          <button className="btn btn-sm btn-primary btn-outline opacity-0 group-hover:opacity-100 transition-opacity">
            Send
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50 flex-shrink-0">
          <h2 className="text-lg font-semibold">Forward Message</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="input input-bordered w-full pl-10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto space-y-4 flex-1">
            {searchTerm ? (
              <div>
                <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2 px-1">Search Results</h3>
                {filteredContacts.length > 0 ? (
                  <div className="space-y-1">
                    {filteredContacts.map(contact => renderUserItem(contact.user, contact.alias))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-base-content/50">
                    No contacts found
                  </div>
                )}
              </div>
            ) : (
              <>
                {recentChats.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2 px-1">Recent Chats</h3>
                    <div className="space-y-1">
                      {recentChats.map(user => {
                        const contactInfo = contacts.find(c => c.user?.id === user.id);
                        return renderUserItem(user, contactInfo?.alias);
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2 px-1 mt-4">All Contacts</h3>
                  {contacts.length > 0 ? (
                    <div className="space-y-1">
                      {contacts.map(contact => renderUserItem(contact.user, contact.alias))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-base-content/50">
                      No contacts found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
