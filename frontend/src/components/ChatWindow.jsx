import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Image, MoreVertical, MessageSquare, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import BackgroundSelector from './BackgroundSelector';

const ChatWindow = () => {
  const { messages, getMessages, sendMessage, selectedUser, setSelectedUser, isMessagesLoading, onlineUsers, socket } = useChatStore();
  const { authUser } = useAuthStore();
  const [text, setText] = useState('');
  const [chatBg, setChatBg] = useState('bg-base-200');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.id);
    }
  }, [selectedUser, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleBgChange = (e) => {
      if (e.detail.conversationId === selectedUser?.id) {
        setChatBg(e.detail.bgClass);
      }
    };
    window.addEventListener('chatBgChanged', handleBgChange);
    return () => window.removeEventListener('chatBgChanged', handleBgChange);
  }, [selectedUser]);

  // Handle typing listener
  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ senderId, isTyping: typingStatus }) => {
      if (selectedUser && senderId === selectedUser.id) {
        setRemoteTyping(typingStatus);
      }
    };
    socket.on('typing', handleTyping);
    return () => socket.off('typing', handleTyping);
  }, [socket, selectedUser]);

  const handleTyping = (e) => {
    setText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { receiverId: selectedUser.id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing', { receiverId: selectedUser.id, isTyping: false });
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage({ text });
    setText('');
    setIsTyping(false);
    socket?.emit('typing', { receiverId: selectedUser.id, isTyping: false });
  };

  const renderMessageStatus = (msg) => {
    if (msg.senderId !== authUser.id) return null;
    
    if (msg.status === 'SENT') {
      return <Check size={14} className="text-base-content/50 ml-1" />;
    } else if (msg.status === 'DELIVERED') {
      return <CheckCheck size={14} className="text-base-content/50 ml-1" />;
    } else if (msg.status === 'READ') {
      return <CheckCheck size={14} className="text-blue-500 ml-1" />;
    }
    return null;
  };

  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-base-200 text-base-content/60">
        <div className="text-center animate-slide-up">
          <div className="bg-primary/10 text-primary p-6 rounded-full inline-block mb-4">
            <MessageSquare size={48} />
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">ChatWave</h2>
          <p>Select a conversation from the sidebar to start messaging.</p>
        </div>
      </div>
    );
  }

  // Determine user status
  const userPresence = onlineUsers[selectedUser.id] || selectedUser.lastSeen;
  let statusText = '';
  if (userPresence === 'online') {
    statusText = 'online';
  } else if (userPresence) {
    try {
      statusText = `last seen ${format(new Date(userPresence), 'HH:mm')}`;
    } catch (e) {
      statusText = 'offline';
    }
  }

  return (
    <div className={`flex-1 flex flex-col bg-cover bg-center transition-all duration-300 ${chatBg}`}>
      <div className="h-16 flex items-center justify-between px-6 bg-base-100/90 backdrop-blur-md border-b border-base-300 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden btn btn-ghost btn-circle btn-sm mr-1"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="avatar placeholder relative">
            {selectedUser.profilePic ? (
              <div className="w-10 rounded-full">
                <img src={selectedUser.profilePic} alt={selectedUser.name} />
              </div>
            ) : (
              <div className="bg-neutral text-neutral-content w-10 rounded-full">
                <span className="text-lg">{selectedUser.name?.charAt(0) || selectedUser.email?.charAt(0)}</span>
              </div>
            )}
            {userPresence === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-base-100 rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{selectedUser.name || selectedUser.email}</h3>
            <p className="text-xs text-base-content/60">{remoteTyping ? <span className="text-primary italic">typing...</span> : statusText}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <BackgroundSelector conversationId={selectedUser.id} />
          <button className="btn btn-ghost btn-circle btn-sm">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isMessagesLoading ? (
          <div className="text-center text-base-content/60 bg-base-100/50 p-2 rounded-lg inline-block mx-auto">Loading messages...</div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === authUser.id;
            return (
              <div key={msg.id || idx} className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
                <div className={`chat-bubble shadow-md ${isMine ? 'chat-bubble-primary text-primary-content' : 'bg-base-100 text-base-content'}`}>
                  {msg.image && <img src={msg.image} alt="Attachment" className="max-w-xs rounded-lg mb-2" />}
                  {msg.text && <p>{msg.text}</p>}
                </div>
                <div className="chat-footer opacity-70 text-xs mt-1 px-2 py-0.5 rounded-full flex items-center justify-end">
                  {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                  {renderMessageStatus(msg)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 flex items-center gap-2">
        <button type="button" className="btn btn-ghost btn-circle text-base-content/60 hover:text-base-content">
          <Image size={22} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="input input-bordered flex-1 rounded-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50 border-none px-6"
          value={text}
          onChange={handleTyping}
        />
        <button type="submit" className="btn btn-primary btn-circle shadow-md" disabled={!text.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
