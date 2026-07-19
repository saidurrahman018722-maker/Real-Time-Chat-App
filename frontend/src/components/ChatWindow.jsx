import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Image, MoreVertical, MessageSquare, Check, CheckCheck, ArrowLeft, FileText, UserPlus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Search, Star, Copy, Trash, Forward, X, CheckSquare, Square, Image as ImageIcon } from 'lucide-react';
import ForwardMessageModal from './ForwardMessageModal';
import BackgroundSelector from './BackgroundSelector';
import SharedMediaModal from './SharedMediaModal';

const ChatWindow = () => {
  const { contacts, messages, getMessages, sendMessage, deleteMessage, toggleFavoriteContact, selectedUser, setSelectedUser, isMessagesLoading, onlineUsers, socket, setIsAddContactOpen, markConversationAsRead, pendingMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [chatBg, setChatBg] = useState('bg-base-200');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);

  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentContact = contacts.find(c => c.user?.id === selectedUser?.id || c.userId === selectedUser?.id);
  const isFavorite = currentContact?.isFavorite || false;

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.id);
      markConversationAsRead(selectedUser.id);
    }
  }, [selectedUser?.id, getMessages, markConversationAsRead]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    sendMessage({ text: text.trim(), image: imagePreview });
    setText('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsTyping(false);
    socket?.emit('typing', { receiverId: selectedUser.id, isTyping: false });
  };

  const renderMessageStatus = (msg) => {
    if (msg.senderId !== authUser.id) return null;

    if (msg.isRead || msg.status === 'READ') {
      return <CheckCheck size={14} className="text-blue-500 ml-1" />;
    }

    return <Check size={14} className="text-base-content/50 ml-1" />;
  };

  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-base-200 text-base-content">
        <div className="flex gap-8 animate-slide-up mt-8">

          <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => alert('Send document feature coming soon!')}>
            <div className="bg-base-300 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-base-300/80 transition-colors">
              <FileText size={28} />
            </div>
            <span className="text-sm font-medium">Send document</span>
          </div>

          <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => setIsAddContactOpen(true)}>
            <div className="bg-base-300 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-base-300/80 transition-colors">
              <UserPlus size={28} />
            </div>
            <span className="text-sm font-medium">Add contact</span>
          </div>

          <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => alert('Meta AI feature coming soon!')}>
            <div className="bg-base-300 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-base-300/80 transition-colors">
              <Sparkles size={28} className="text-primary" />
            </div>
            <span className="text-sm font-medium">Ask Meta AI</span>
          </div>

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

  const displayedMessages = messages.filter(msg =>
    !searchQuery || msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelectMessage = (msgId) => {
    if (selectedMessageIds.includes(msgId)) {
      setSelectedMessageIds(selectedMessageIds.filter(id => id !== msgId));
    } else {
      setSelectedMessageIds([...selectedMessageIds, msgId]);
    }
  };

  const handleCopySelected = () => {
    const textToCopy = messages
      .filter(m => selectedMessageIds.includes(m.id) && m.text)
      .map(m => m.text)
      .join('\n\n');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
    }
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };

  const handleDeleteSelected = (forEveryone) => {
    selectedMessageIds.forEach(id => {
      deleteMessage(id, forEveryone);
    });
    setIsSelectMode(false);
    setSelectedMessageIds([]);
    setIsMultiDeleteOpen(false);
  };

  const canDeleteForEveryone = selectedMessageIds.every(id => {
    const msg = messages.find(m => m.id === id);
    return msg?.senderId === authUser.id;
  });

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
            <h3 className="font-semibold leading-tight flex items-center gap-2">
              {selectedUser.name || selectedUser.email}
              {isFavorite && <Star size={14} className="text-warning fill-warning" />}
            </h3>
            <p className="text-xs text-base-content/60">{remoteTyping ? <span className="text-primary italic">typing...</span> : statusText}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
              <MoreVertical size={20} />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
              {currentContact && (
                <li>
                  <button onClick={() => toggleFavoriteContact(currentContact.id)}>
                    <Star size={16} className={isFavorite ? 'text-warning fill-warning' : ''} />
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorite'}
                  </button>
                </li>
              )}

              <li><button onClick={() => setIsSharedMediaOpen(true)}><ImageIcon size={16} /> Shared Media</button></li>
              <li><button onClick={() => setIsSearching(!isSearching)}><Search size={16} /> Search Chat</button></li>
              <li>
                <button onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedMessageIds([]);
                }}>
                  <CheckSquare size={16} /> {isSelectMode ? 'Cancel Selection' : 'Select Messages'}
                </button>
              </li>
              <div className="divider my-0"></div>
              <li><button onClick={() => setSelectedUser(null)} className="text-error"><X size={16} /> Close Chat</button></li>
            </ul>
          </div>
        </div>
      </div>

      {isSearching && (
        <div className="px-6 py-2 bg-base-200 border-b border-base-300 animate-slide-down flex items-center gap-2">
          <Search size={16} className="text-base-content/50" />
          <input
            type="text"
            placeholder="Search messages..."
            className="input input-sm input-ghost w-full focus:outline-none focus:bg-transparent px-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="btn btn-ghost btn-sm btn-circle"><X size={16} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isMessagesLoading ? (
          <div className="text-center text-base-content/60 bg-base-100/50 p-2 rounded-lg inline-block mx-auto">Loading messages...</div>
        ) : (
          displayedMessages.map((msg, idx) => {
            const isMine = msg.senderId === authUser.id;
            return (
              <div key={msg.id || idx} className={`chat ${isMine ? 'chat-end' : 'chat-start'} group items-center`}>
                {isSelectMode && !isMine && (
                  <button
                    className="mr-2 text-base-content/50 hover:text-primary transition-colors"
                    onClick={() => handleToggleSelectMessage(msg.id)}
                  >
                    {selectedMessageIds.includes(msg.id) ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
                  </button>
                )}

                <div
                  className={`chat-bubble shadow-md relative cursor-pointer hover:opacity-90 transition-opacity ${isMine ? 'chat-bubble-primary text-primary-content' : 'bg-base-100 text-base-content'} ${isSelectMode && selectedMessageIds.includes(msg.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''}`}
                  onClick={() => {
                    if (isSelectMode) {
                      handleToggleSelectMessage(msg.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isSelectMode) {
                      setSelectedMessage(msg);
                    }
                  }}
                >
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Attachment" 
                      className="max-w-xs rounded-lg mb-2 hover:brightness-95 transition-all" 
                      onClick={(e) => {
                        if (!isSelectMode) {
                          e.stopPropagation();
                          setFullscreenImage(msg.image);
                        }
                      }}
                    />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                </div>

                {isSelectMode && isMine && (
                  <button
                    className="ml-2 text-base-content/50 hover:text-primary transition-colors"
                    onClick={() => handleToggleSelectMessage(msg.id)}
                  >
                    {selectedMessageIds.includes(msg.id) ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
                  </button>
                )}

                <div className="chat-footer opacity-70 text-xs mt-1 px-2 py-0.5 rounded-full flex items-center justify-end">
                  {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                  {renderMessageStatus(msg)}
                </div>
              </div>
            );
          })
        )}
        
        {pendingMessage && pendingMessage.receiverId === selectedUser.id && (
          <div className="chat chat-end group items-center animate-fade-in">
            <div className="chat-bubble shadow-md relative chat-bubble-primary text-primary-content opacity-80">
              {pendingMessage.image && (
                <div className="relative">
                   <img src={pendingMessage.image} alt="Uploading" className="max-w-xs rounded-lg mb-2 blur-[2px]" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="loading loading-spinner loading-md text-base-100"></span>
                   </div>
                </div>
              )}
              {pendingMessage.text && <p>{pendingMessage.text}</p>}
            </div>
            <div className="chat-footer opacity-50 text-xs mt-1 flex items-center justify-end">
              sending...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {imagePreview && (
        <div className="px-4 py-2 bg-base-200 border-t border-base-300 relative">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-24 rounded-lg shadow-sm border border-base-300" />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error shadow-md"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {isSelectMode ? (
        <div className="p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 flex items-center justify-between shadow-lg">
          <span className="font-semibold text-primary">{selectedMessageIds.length} selected</span>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm tooltip tooltip-top"
              data-tip="Copy"
              onClick={handleCopySelected}
              disabled={selectedMessageIds.length === 0}
            >
              <Copy size={20} />
            </button>
            <button
              className="btn btn-ghost btn-sm tooltip tooltip-top"
              data-tip="Forward"
              onClick={() => {
                const combinedText = messages.filter(m => selectedMessageIds.includes(m.id) && m.text).map(m => m.text).join('\n\n');
                const firstImage = messages.find(m => selectedMessageIds.includes(m.id) && m.image)?.image;
                setSelectedMessage({ text: combinedText, image: firstImage });
                setIsForwardOpen(true);
              }}
              disabled={selectedMessageIds.length === 0}
            >
              <Forward size={20} />
            </button>
            <button
              className="btn btn-ghost btn-sm text-error tooltip tooltip-top"
              data-tip="Delete"
              onClick={() => setIsMultiDeleteOpen(true)}
              disabled={selectedMessageIds.length === 0}
            >
              <Trash size={20} />
            </button>
            <div className="divider divider-horizontal mx-0"></div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedMessageIds([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost btn-circle text-base-content/60 hover:text-base-content"
          >
            <Image size={22} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered flex-1 rounded-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50 border-none px-6"
            value={text}
            onChange={handleTyping}
          />
          <button type="submit" className="btn btn-primary btn-circle shadow-md" disabled={!text.trim() && !imagePreview}>
            <Send size={20} />
          </button>
        </form>
      )}

      {/* Multi-Delete Confirmation Modal */}
      {isMultiDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsMultiDeleteOpen(false)}>
          <div className="bg-base-100 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-slide-up mb-0 sm:mb-8" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-base-300">
              <h3 className="font-semibold text-lg text-error">Delete Messages?</h3>
            </div>
            <ul className="menu p-2 w-full text-base">
              <li>
                <button
                  className="text-error"
                  onClick={() => handleDeleteSelected(false)}
                >
                  <Trash size={18} /> Delete for me
                </button>
              </li>
              {canDeleteForEveryone && (
                <li>
                  <button
                    className="text-error"
                    onClick={() => handleDeleteSelected(true)}
                  >
                    <Trash size={18} /> Delete for everyone
                  </button>
                </li>
              )}
              <div className="divider my-1"></div>
              <li>
                <button onClick={() => setIsMultiDeleteOpen(false)} className="justify-center font-medium">
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Message Selection Modal/Popup */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMessage(null)}>
          <div className="bg-base-100 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-slide-up mb-0 sm:mb-8" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-base-300">
              <h3 className="font-semibold text-lg">Message Options</h3>
            </div>
            <ul className="menu p-2 w-full text-base">
              <li>
                <button onClick={() => {
                  navigator.clipboard.writeText(selectedMessage.text || '');
                  setSelectedMessage(null);
                }}>
                  <Copy size={18} /> Copy text
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setSelectedMessage(null);
                  setIsForwardOpen(true);
                }}>
                  <Forward size={18} /> Forward
                </button>
              </li>

              <div className="divider my-1"></div>

              <li>
                <button
                  className="text-error"
                  onClick={() => {
                    deleteMessage(selectedMessage.id, false);
                    setSelectedMessage(null);
                  }}
                >
                  <Trash size={18} /> Delete for me
                </button>
              </li>
              {selectedMessage.senderId === authUser.id && (
                <li>
                  <button
                    className="text-error"
                    onClick={() => {
                      deleteMessage(selectedMessage.id, true);
                      setSelectedMessage(null);
                    }}
                  >
                    <Trash size={18} /> Delete for everyone
                  </button>
                </li>
              )}

              <div className="divider my-1"></div>
              <li>
                <button onClick={() => setSelectedMessage(null)} className="justify-center font-medium">
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {isForwardOpen && selectedMessage && (
        <ForwardMessageModal
          isOpen={isForwardOpen}
          onClose={() => setIsForwardOpen(false)}
          messageData={{ text: selectedMessage.text, image: selectedMessage.image }}
        />
      )}

      {/* Background Selector Modal */}
      <BackgroundSelector conversationId={selectedUser.id} />

      {/* Shared Media Modal */}
      <SharedMediaModal
        isOpen={isSharedMediaOpen}
        onClose={() => setIsSharedMediaOpen(false)}
      />

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[70] flex justify-center items-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/20" onClick={() => setFullscreenImage(null)}>
            <X size={24} />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg animate-scale-in" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
