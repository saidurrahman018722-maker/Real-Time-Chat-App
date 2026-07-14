import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Search, X, CheckCircle2 } from 'lucide-react';

const ForwardMessageModal = ({ isOpen, onClose, messageData }) => {
  const { contacts, forwardMessage } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [forwardingTo, setForwardingTo] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((contact) =>
    contact.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleForward = async (contact) => {
    setForwardingTo(contact.user.id);
    const result = await forwardMessage(messageData, contact.user.id);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForwardingTo(null);
        onClose();
      }, 1500);
    } else {
      setForwardingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up relative">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <h2 className="text-lg font-semibold">Forward Message</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="input input-bordered w-full pl-10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition-colors cursor-pointer group"
                  onClick={() => !forwardingTo && handleForward(contact)}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        {contact.user.profilePic ? (
                          <img src={contact.user.profilePic} alt={contact.user.name} />
                        ) : (
                          <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-lg font-semibold">
                            {contact.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{contact.alias || contact.user.name}</h3>
                      <p className="text-xs text-base-content/60">{contact.user.email}</p>
                    </div>
                  </div>
                  
                  {forwardingTo === contact.user.id ? (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  ) : success && forwardingTo === contact.user.id ? (
                    <CheckCircle2 className="text-success" size={20} />
                  ) : (
                    <button className="btn btn-sm btn-primary btn-outline opacity-0 group-hover:opacity-100 transition-opacity">
                      Send
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-base-content/50">
                No contacts found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
