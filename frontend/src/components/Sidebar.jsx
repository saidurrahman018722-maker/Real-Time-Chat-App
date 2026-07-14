import { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Search, UserPlus, Settings, MessageSquarePlus, Star } from 'lucide-react';
import { format } from 'date-fns';

import { Link } from 'react-router-dom';
import AddContactModal from './AddContactModal';
import NewChatModal from './NewChatModal';

const Sidebar = () => {
  const { contacts, conversations, getConversations, getContacts, selectedUser, setSelectedUser, isConversationsLoading, isAddContactOpen, setIsAddContactOpen } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  useEffect(() => {
    getConversations();
    getContacts();
  }, [getConversations, getContacts]);

  const filteredConversations = conversations.filter(conv => 
    conv.partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`border-r border-base-300 flex-col bg-base-100 ${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 transition-all duration-300`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-base-300">
        <h2 className="text-xl font-bold">Chats</h2>
        <div className="flex gap-2">
          <Link to="/settings" className="btn btn-ghost btn-circle btn-sm">
            <Settings size={20} />
          </Link>
          <button 
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setIsNewChatOpen(true)}
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button 
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setIsAddContactOpen(true)}
            title="Add Contact"
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-base-300">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search active chats..." 
            className="input input-bordered w-full pl-10 bg-base-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isConversationsLoading ? (
          <div className="p-4 text-center text-base-content/60">Loading chats...</div>
        ) : (
          filteredConversations.map((conv) => (
            <div 
              key={conv.id} 
              className={`flex items-center p-4 cursor-pointer hover:bg-base-200 transition-colors border-l-4 ${selectedUser?.id === conv.partner.id ? 'bg-base-200 border-primary' : 'border-transparent'}`}
              onClick={() => setSelectedUser(conv.partner)}
            >
              <div className="avatar placeholder mr-4">
                {conv.partner.profilePic ? (
                  <div className="w-12 rounded-full">
                    <img src={conv.partner.profilePic} alt={conv.partner.name} />
                  </div>
                ) : (
                  <div className="bg-neutral text-neutral-content w-12 rounded-full">
                    <span className="text-lg">{conv.partner.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="font-semibold truncate">{conv.partner.name}</span>
                    {contacts.find(c => c.user?.id === conv.partner.id || c.userId === conv.partner.id)?.isFavorite && (
                      <Star size={12} className="text-warning fill-warning flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-base-content/60 ml-2 flex-shrink-0">
                    {conv.updatedAt ? format(new Date(conv.updatedAt), 'HH:mm') : ''}
                  </span>
                </div>
                <div className="text-sm text-base-content/60 truncate">
                  {conv.lastMessage?.text || 'Started a conversation'}
                </div>
              </div>
            </div>
          ))
        )}
        {!isConversationsLoading && filteredConversations.length === 0 && (
          <div className="text-center p-4 text-base-content/50">
            {searchTerm ? "No chats found." : "No active chats yet."}
          </div>
        )}
      </div>

      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)} 
      />
      
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
