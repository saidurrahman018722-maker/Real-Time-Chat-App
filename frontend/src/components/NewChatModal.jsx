import { useState, useMemo } from 'react';
import { Search, X, MessageSquarePlus } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const NewChatModal = ({ isOpen, onClose }) => {
  const { contacts, setSelectedUser } = useChatStore();
  const [query, setQuery] = useState('');

  const filteredContacts = useMemo(() => {
    if (!query.trim()) return contacts;
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.user.name.toLowerCase().includes(lowerQuery) || 
      contact.user.email.toLowerCase().includes(lowerQuery)
    );
  }, [query, contacts]);

  const handleStartChat = (contactUser) => {
    setSelectedUser(contactUser);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md bg-base-100 p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-primary" /> New Chat
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-base-300">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search your contacts..." 
              className="input input-bordered w-full pl-10 bg-base-200 focus:input-primary transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {contacts.length === 0 && (
            <div className="text-center p-6 text-base-content/50 flex flex-col items-center gap-2">
              <p>You don't have any contacts yet.</p>
              <p className="text-sm">Use the "Add Contact" button to find people.</p>
            </div>
          )}

          {contacts.length > 0 && filteredContacts.length === 0 && (
            <div className="text-center p-4 text-base-content/50">
              No contacts found matching "{query}"
            </div>
          )}

          <div className="space-y-1">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id} 
                className="flex items-center gap-3 p-3 bg-base-100 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                onClick={() => handleStartChat(contact.user)}
              >
                <div className="avatar placeholder">
                  {contact.user.profilePic ? (
                    <div className="w-10 rounded-full">
                      <img src={contact.user.profilePic} alt={contact.user.name} />
                    </div>
                  ) : (
                    <div className="bg-neutral text-neutral-content w-10 rounded-full">
                      <span className="text-sm">{contact.user.name?.charAt(0) || contact.user.email?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-sm">{contact.user.name}</span>
                  <span className="text-xs text-base-content/60 truncate">{contact.user.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default NewChatModal;
