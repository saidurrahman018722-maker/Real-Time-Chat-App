import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Search, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import ThemeSwitcher from './ThemeSwitcher';

const Sidebar = () => {
  const { conversations, getConversations, selectedUser, setSelectedUser, isConversationsLoading } = useChatStore();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  return (
    <aside className="w-80 border-r border-base-300 flex flex-col bg-base-100">
      <div className="h-16 flex items-center justify-between px-4 border-b border-base-300">
        <h2 className="text-xl font-bold">Chats</h2>
        <div className="flex gap-2">
          <ThemeSwitcher />
          <button className="btn btn-ghost btn-circle btn-sm">
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
            placeholder="Search contacts..." 
            className="input input-bordered w-full pl-10 bg-base-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isConversationsLoading ? (
          <div className="p-4 text-center text-base-content/60">Loading chats...</div>
        ) : (
          conversations.map((conv) => (
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
                  <span className="font-semibold truncate">{conv.partner.name}</span>
                  <span className="text-xs text-base-content/60">
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
      </div>
    </aside>
  );
};

export default Sidebar;
