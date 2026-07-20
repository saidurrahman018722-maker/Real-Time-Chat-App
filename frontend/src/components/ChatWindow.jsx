import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Image, MoreVertical, Smile, MessageSquare, Check, CheckCheck, ArrowLeft, FileText, UserPlus, Sparkles, Plus, User, X, Search, Star, Copy, Trash, Forward, CheckSquare, Square, Image as ImageIcon, Pin, ChevronDown, Ban, Camera, Video, File, Play, Mic, Pause, Download, Link } from 'lucide-react';
import { format } from 'date-fns';
import ForwardMessageModal from './ForwardMessageModal';
import BackgroundSelector from './BackgroundSelector';
import SharedMediaModal from './SharedMediaModal';
import ContactInfoPage from './ContactInfoPage';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ShareContactModal from './ShareContactModal';
import MessageContextMenu from './MessageContextMenu';
const ChatWindow = () => {
  const { contacts, messages, getMessages, loadMoreMessages, sendMessage, deleteMessage, reactToMessage, toggleFavoriteContact, selectedUser, setSelectedUser, isMessagesLoading, isMoreMessagesLoading, hasMoreMessages, onlineUsers, socket, setIsAddContactOpen, markConversationAsRead, pendingMessage, togglePinMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [audioPreview, setAudioPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [audioVolumes, setAudioVolumes] = useState(Array(21).fill(2));

  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const shouldSendOnStopRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const [chatBg, setChatBg] = useState('bg-base-200');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const touchTimerRef = useRef(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectAction, setSelectAction] = useState(null); // 'delete' | 'forward'
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);

  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState(false);
  const [isShareContactOpen, setIsShareContactOpen] = useState(false);
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUnblockOpen, setIsConfirmUnblockOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const currentContact = contacts.find(c => c.user?.id === selectedUser?.id || c.userId === selectedUser?.id);
  const isFavorite = currentContact?.isFavorite || false;

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.id);
      markConversationAsRead?.(selectedUser.id);
    }
  }, [selectedUser?.id, getMessages, markConversationAsRead]);

  const prevMessagesLengthRef = useRef(messages.length);
  const prevMessagesFirstIdRef = useRef(messages[0]?.id);
  const prevMessagesLastIdRef = useRef(messages[messages.length - 1]?.id);
  const previousScrollHeightRef = useRef(0);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (messages.length > 0 && prevMessagesLengthRef.current > 0) {
      const firstIdChanged = messages[0]?.id !== prevMessagesFirstIdRef.current;
      const lastIdSame = messages[messages.length - 1]?.id === prevMessagesLastIdRef.current;
      
      if (firstIdChanged && lastIdSame) {
        // Prepended older messages! Maintain scroll position.
        container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
      } else if (messages.length > prevMessagesLengthRef.current) {
        // Appended new message
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
      // Initial load
      messagesEndRef.current?.scrollIntoView();
    }
    
    prevMessagesLengthRef.current = messages.length;
    prevMessagesFirstIdRef.current = messages[0]?.id;
    prevMessagesLastIdRef.current = messages[messages.length - 1]?.id;
    previousScrollHeightRef.current = container.scrollHeight;
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }

    if (scrollTop === 0 && hasMoreMessages && !isMoreMessagesLoading) {
      loadMoreMessages(selectedUser.id);
    }
  };



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
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setDocumentPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateVisualizer = () => {
    if (!isRecordingRef.current) return;
    const { analyser, dataArray } = analyserRef.current;
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      
      const step = Math.floor(dataArray.length / 21);
      const newVolumes = [];
      for (let i = 0; i < 21; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] || 0;
        }
        const avg = sum / (step || 1);
        const val = 2 + Math.pow(avg / 255, 1.2) * 24; // More dynamic range
        newVolumes.push(val);
      }
      setAudioVolumes(newVolumes);
    }
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      shouldSendOnStopRef.current = false;
      isRecordingRef.current = true;
      isCancelledRef.current = false;

      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 64;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyserRef.current = { audioContext, analyser, dataArray, source };
        updateVisualizer();
      } catch (err) {
        console.error('AudioContext setup failed', err);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (isCancelledRef.current) {
          stream.getTracks().forEach(track => track.stop());
          isRecordingRef.current = false;
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          if (analyserRef.current?.audioContext) analyserRef.current.audioContext.close();
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (shouldSendOnStopRef.current) {
            sendMessage({
              receiverId: selectedUser.id,
              audio: reader.result
            });
          } else {
            setAudioPreview(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        isRecordingRef.current = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (analyserRef.current?.audioContext) analyserRef.current.audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isRecordingPaused) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      isRecordingRef.current = true;
      updateVisualizer();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      isRecordingRef.current = false;
      clearInterval(recordingTimerRef.current);
    }
  };

  const finishAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendOnStopRef.current = true;
      stopRecording();
    }
  };

  const cancelRecording = () => {
    shouldSendOnStopRef.current = false;
    isCancelledRef.current = true;
    stopRecording();
    setAudioPreview(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview && !documentPreview && !audioPreview) return;
    sendMessage({ 
      text: text.trim(), 
      image: imagePreview, 
      video: videoPreview, 
      document: documentPreview, 
      audio: audioPreview, 
      replyToId: replyingToMessage?.id 
    });
    setText('');
    setImagePreview(null);
    setVideoPreview(null);
    setDocumentPreview(null);
    setAudioPreview(null);
    setDocumentName('');
    setReplyingToMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';
    setIsTyping(false);
    socket?.emit('typing', { receiverId: selectedUser.id, isTyping: false });
  };

  const renderMessageStatus = (msg) => {
    if (msg.senderId !== authUser?.id) return null;

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

  const pinnedMessages = messages.filter(m => m.isPinned);

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
    return msg?.senderId === authUser?.id;
  });

  const allSelectedPinned = selectedMessageIds.length > 0 && selectedMessageIds.every(id => {
    const msg = messages.find(m => m.id === id);
    return msg?.isPinned;
  });

  const handleBulkPin = () => {
    selectedMessageIds.forEach(id => togglePinMessage(id));
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };

  if (isContactInfoOpen) {
    return <ContactInfoPage onClose={() => setIsContactInfoOpen(false)} />;
  }

  return (
    <div className={`flex-1 flex flex-col bg-cover bg-center transition-all duration-300 ${chatBg} relative`}>
      {isSelectMode ? (
        <div className="h-16 flex items-center justify-between px-6 bg-base-100/90 backdrop-blur-md border-b border-base-300 shadow-sm z-10 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-ghost btn-circle btn-sm"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedMessageIds([]);
                setSelectAction(null);
              }}
            >
              <X size={20} />
            </button>
            <span className="font-semibold text-lg">{selectedMessageIds.length} Selected</span>
          </div>
          <div>
            {selectAction === 'delete' ? (
              <button
                className="btn btn-error btn-sm gap-2"
                disabled={selectedMessageIds.length === 0}
                onClick={() => setIsMultiDeleteOpen(true)}
              >
                <Trash size={16} /> Delete
              </button>
            ) : selectAction === 'pin' ? (
              <button 
                className="btn btn-primary btn-sm gap-2"
                disabled={selectedMessageIds.length === 0}
                onClick={handleBulkPin}
              >
                <Pin size={16} className={allSelectedPinned ? 'fill-current' : ''} /> {allSelectedPinned ? 'Unpin' : 'Pin'}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm gap-2"
                disabled={selectedMessageIds.length === 0}
                onClick={() => setIsForwardOpen(true)}
              >
                <Forward size={16} /> Forward
              </button>
            )}
          </div>
        </div>
      ) : (
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
                <li><button onClick={() => setIsContactInfoOpen(true)}><User size={16} /> Contact Info</button></li>
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
                    setIsSelectMode(true);
                    setSelectAction('pin');
                    setSelectedMessageIds([]);
                  }}>
                    <Pin size={16} /> Pin / Unpin Messages
                  </button>
                </li>
                <li>
                  <button onClick={() => {
                    setIsSelectMode(true);
                    setSelectAction('forward');
                    setSelectedMessageIds([]);
                  }}>
                    <Forward size={16} /> Forward Messages
                  </button>
                </li>
                <li>
                  <button onClick={() => {
                    setIsSelectMode(true);
                    setSelectAction('delete');
                    setSelectedMessageIds([]);
                  }}>
                    <Trash size={16} /> Delete Messages
                  </button>
                </li>
                <div className="divider my-0"></div>
                <li><button onClick={() => setSelectedUser(null)} className="text-error"><X size={16} /> Close Chat</button></li>
              </ul>
            </div>
          </div>
        </div>
      )}

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

      {pinnedMessages.length > 0 && !isSelectMode && (
        <div className="bg-base-200/95 backdrop-blur-md border-b border-base-300 max-h-32 overflow-y-auto animate-slide-down shadow-inner z-10 flex flex-col">
          {pinnedMessages.map(pinnedMsg => (
            <div key={`pinned-${pinnedMsg.id}`} className="flex items-center justify-between px-6 py-2 border-b border-base-300 last:border-0 hover:bg-base-300/50 transition-colors group">
              <div className="flex items-start gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => {
                const el = document.getElementById(`message-${pinnedMsg.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('animate-pulse');
                  setTimeout(() => el.classList.remove('animate-pulse'), 2000);
                }
              }}>
                <Pin size={14} className="text-primary mt-1 flex-shrink-0 fill-current" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block truncate">
                    Pinned {pinnedMsg.senderId === authUser?.id ? 'by You' : ''}
                  </span>
                  <span className="text-sm text-base-content/80 truncate block">
                    {pinnedMsg.text || (pinnedMsg.image ? '📷 Photo' : 'Message')}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error transition-colors ml-2"
                onClick={(e) => { e.stopPropagation(); togglePinMessage(pinnedMsg.id); }}
                title="Unpin message"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" onScroll={handleScroll} ref={scrollContainerRef}>
          {isMessagesLoading ? (
            <div className="text-center text-base-content/60 bg-base-100/50 p-2 rounded-lg inline-block mx-auto">Loading messages...</div>
          ) : (
            <>
              {isMoreMessagesLoading && (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-sm text-primary"></span>
                </div>
              )}
              {displayedMessages.map((msg, idx) => {
              const isMine = msg.senderId === authUser?.id;
              return (
                <div id={`message-${msg.id}`} key={msg.id || idx} className={`chat ${isMine ? 'chat-end' : 'chat-start'} group items-center`}>
                  {isSelectMode && !isMine && (
                    <button
                      className="mr-2 text-base-content/50 hover:text-primary transition-colors"
                      onClick={() => handleToggleSelectMessage(msg.id)}
                    >
                      {selectedMessageIds.includes(msg.id) ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
                    </button>
                  )}

                  <div className="relative group/bubble flex items-center">
                    {!isMine && !isSelectMode && (
                      <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute -right-8 flex gap-1 z-10">
                        <button className="btn btn-ghost btn-xs btn-circle bg-base-100 shadow-sm" onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message: msg,
                            isMine
                          });
                        }} title="Menu">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    <div
                      className={`chat-bubble shadow-md relative cursor-pointer hover:opacity-90 transition-opacity ${isMine ? 'chat-bubble-primary text-primary-content' : 'bg-base-100 text-base-content'} ${msg.image && !msg.text ? 'p-1 overflow-hidden' : ''} ${msg.audio ? 'min-w-[250px]' : ''} ${isSelectMode && selectedMessageIds.includes(msg.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''} ${msg.reactions && msg.reactions.length > 0 ? 'mb-4' : ''}`}
                      onClick={(e) => {
                        if (isSelectMode) {
                          handleToggleSelectMessage(msg.id);
                        } else {
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message: msg,
                            isMine
                          });
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!isSelectMode) {
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message: msg,
                            isMine
                          });
                        }
                      }}
                      onTouchStart={(e) => {
                        if (!isSelectMode) {
                          const touch = e.touches[0];
                          touchTimerRef.current = setTimeout(() => {
                            setContextMenu({
                              x: touch.clientX,
                              y: touch.clientY,
                              message: msg,
                              isMine
                            });
                          }, 500);
                        }
                      }}
                      onTouchEnd={() => {
                        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                      }}
                      onTouchMove={() => {
                        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                      }}
                    >
                      {msg.isPinned && (
                        <Pin 
                          size={18} 
                          className={`absolute top-2 right-2 z-10 rotate-[30deg] drop-shadow-md bg-base-100/30 backdrop-blur-sm rounded-full p-0.5 ${isMine ? 'text-primary-content fill-primary-content/80' : 'text-base-content fill-base-content/80'}`} 
                        />
                      )}
                      {msg.isForwarded && (
                        <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1 italic">
                          <Forward size={10} /> Forwarded
                        </div>
                      )}
                      {msg.replyTo && (
                        <div
                          className={`text-xs p-2 rounded mb-2 border-l-4 cursor-pointer hover:brightness-95 transition-all ${isMine ? 'bg-black/10 border-base-100/50' : 'bg-base-200 border-primary'}`}
                          onClick={() => {
                            const el = document.getElementById(`message-${msg.replyTo.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('animate-pulse');
                              setTimeout(() => el.classList.remove('animate-pulse'), 2000);
                            }
                          }}
                        >
                          <span className="font-semibold block opacity-80 mb-0.5">
                            {msg.replyTo.senderId === authUser?.id ? 'You' : currentContact?.alias || selectedUser.name}
                          </span>
                          <span className="opacity-70 line-clamp-1">{msg.replyTo.text || 'Photo'}</span>
                        </div>
                      )}

                      {!msg.isDeletedForEveryone && msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Attachment" 
                          className={`max-w-xs rounded-lg hover:brightness-95 transition-all ${msg.text ? 'mb-2' : ''}`} 
                          onClick={(e) => {
                            if (!isSelectMode) {
                              e.stopPropagation();
                              setFullscreenImage(msg.image);
                            }
                          }}
                        />
                      )}
                      {!msg.isDeletedForEveryone && msg.video && (
                        <video 
                          src={msg.video} 
                          controls
                          className={`max-w-xs rounded-lg ${msg.text ? 'mb-2' : ''}`}
                        />
                      )}
                      {!msg.isDeletedForEveryone && msg.audio && (
                        <div className={msg.text ? 'mb-2' : ''}>
                          <VoiceMessagePlayer src={msg.audio} isMine={isMine} />
                        </div>
                      )}
                      {!msg.isDeletedForEveryone && msg.document && (
                        <a 
                          href={msg.document} 
                          target="_blank" rel="noreferrer"
                          className={`flex items-center gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-300/80 transition-colors ${msg.text ? 'mb-2' : ''}`}
                        >
                          <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Document</p>
                            <p className="text-xs text-base-content/60">Click to view/download</p>
                          </div>
                        </a>
                      )}
                      {msg.sharedContact && (
                        <div className="flex flex-col gap-2 p-2 bg-base-100/10 rounded-lg min-w-[200px]">
                          <div className="flex items-center gap-3 border-b border-base-content/10 pb-2">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden flex items-center justify-center">
                                {msg.sharedContact.profilePic ? (
                                  <img src={msg.sharedContact.profilePic} alt={msg.sharedContact.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={20} className="text-base-content/50" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 font-semibold text-sm">
                              {msg.sharedContact.name}
                            </div>
                          </div>
                          <button 
                            className="btn btn-sm btn-ghost w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              const contact = contacts.find(c => c.user?.id === msg.sharedContact.id);
                              if (contact) {
                                setSelectedUser(contact.user);
                              } else {
                                setSelectedUser(msg.sharedContact);
                              }
                            }}
                          >
                            Message
                          </button>
                        </div>
                      )}
                      {msg.text && <p>{msg.text}</p>}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`absolute -bottom-3.5 ${isMine ? 'right-2' : 'left-2'} flex flex-wrap gap-1 z-20`}>
                          {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                            const count = msg.reactions.filter(r => r.emoji === emoji).length;
                            const reactedByMe = msg.reactions.some(r => r.emoji === emoji && r.userId === authUser?.id);
                            return (
                              <div
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reactToMessage(msg.id, emoji);
                                }}
                                className={`text-[13px] px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer select-none border-2 border-base-100 shadow-sm leading-none ${reactedByMe ? 'bg-primary/20 text-primary' : 'bg-base-300 text-base-content'}`}
                              >
                                <span>{emoji}</span>
                                {count > 1 && <span className="opacity-70 font-semibold">{count}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isMine && !isSelectMode && (
                      <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute -left-8 flex gap-1 z-10">
                        <button className="btn btn-ghost btn-xs btn-circle bg-base-100 shadow-sm" onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message: msg,
                            isMine
                          });
                        }} title="Menu">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {isSelectMode && isMine && (
                    <button
                      className="ml-2 text-base-content/50 hover:text-primary transition-colors"
                      onClick={() => handleToggleSelectMessage(msg.id)}
                    >
                      {selectedMessageIds.includes(msg.id) ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
                    </button>
                  )}

                  <div className="chat-footer opacity-70 text-xs mt-1 px-2 py-0.5 rounded-full flex items-center justify-end gap-1">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                    {renderMessageStatus(msg)}
                  </div>
                </div>
              );
            })}
            </>
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
                {pendingMessage.video && (
                  <div className="relative">
                    <video src={pendingMessage.video} className="max-w-xs rounded-lg mb-2 blur-[2px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="loading loading-spinner loading-md text-base-100"></span>
                    </div>
                  </div>
                )}
                {pendingMessage.document && (
                  <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg opacity-50 mb-2">
                    <FileText size={20} /> Document uploading...
                  </div>
                )}
                {pendingMessage.audio && (
                  <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg opacity-50 mb-2">
                    <Mic size={20} /> Voice sending...
                  </div>
                )}
                {pendingMessage.text && <p>{pendingMessage.text}</p>}
              </div>
              <div className="chat-footer opacity-50 text-xs mt-1 flex items-center justify-end">
                sending...
              </div>
            </div>
          )}
          {/* Invisible element to scroll to bottom */}
          <div ref={messagesEndRef} />
      </div>

      {(imagePreview || videoPreview || documentPreview || audioPreview) && (
        <div className="px-4 py-3 bg-base-200 border-t border-base-300 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-base-300" />}
            {videoPreview && <video src={videoPreview} className="w-16 h-12 object-cover rounded-lg border border-base-300" />}
            {documentPreview && <div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center"><FileText size={24} /></div>}
            {audioPreview && <div className="flex items-center gap-2 bg-base-300 p-2 rounded-lg"><Play size={20} className="text-primary" /><div className="w-24 h-1 bg-primary/20 rounded-full"><div className="w-full h-full bg-primary rounded-full"></div></div></div>}
            <div className="text-sm font-medium">
              {imagePreview && 'Image attached'}
              {videoPreview && 'Video attached'}
              {documentPreview && documentName}
              {audioPreview && 'Voice message'}
            </div>
          </div>
          <button onClick={() => {
            setImagePreview(null);
            setVideoPreview(null);
            setDocumentPreview(null);
            setAudioPreview(null);
            setDocumentName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (videoInputRef.current) videoInputRef.current.value = '';
            if (documentInputRef.current) documentInputRef.current.value = '';
          }} className="btn btn-ghost btn-sm btn-circle hover:bg-error/20 hover:text-error transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {replyingToMessage && (
        <div className="px-4 py-2 bg-base-200 border-t border-base-300 relative flex items-center justify-between">
          <div className="flex-1 border-l-4 border-primary pl-3">
            <span className="font-semibold text-xs text-primary block mb-0.5">
              Replying to {replyingToMessage.senderId === authUser?.id ? 'yourself' : selectedUser.name}
            </span>
            <span className="text-sm text-base-content/70 line-clamp-1">
              {replyingToMessage.text || 
                (replyingToMessage.audio ? 'Voice Message' : 
                 replyingToMessage.video ? 'Video' : 
                 replyingToMessage.document ? 'Document' : 
                 replyingToMessage.image ? 'Photo' : 'Media')}
            </span>
          </div>
          <button onClick={() => setReplyingToMessage(null)} className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content">
            <X size={16} />
          </button>
        </div>
      )}
        {showScrollButton && (
          <button 
            className="btn btn-circle btn-sm btn-primary absolute bottom-24 right-4 z-50 shadow-lg animate-bounce"
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ChevronDown size={20} />
          </button>
        )}
        {currentContact?.isBlocked ? (
          <div className="p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 flex items-center justify-center gap-4 h-[72px]">
            <button 
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#3e4446] text-[#ea6d7e] hover:bg-[#2a2f32] transition-colors font-medium text-sm"
            >
              <Trash size={18} /> Delete chat
            </button>
            <button 
              onClick={() => setIsConfirmUnblockOpen(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#3e4446] text-[#00a884] hover:bg-[#2a2f32] transition-colors font-medium text-sm"
            >
              <Ban size={18} /> Unblock
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
            <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" ref={documentInputRef} onChange={handleDocumentChange} />
            
            <div className="dropdown dropdown-top">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-base-content/60 hover:text-base-content">
                <Plus size={22} />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 mb-2 border border-base-300">
                <li><a onClick={() => { fileInputRef.current?.click(); document.activeElement?.blur(); }}><Image size={18} /> Image</a></li>
                <li><a onClick={() => { videoInputRef.current?.click(); document.activeElement?.blur(); }}><Video size={18} /> Video</a></li>
                <li><a onClick={() => { documentInputRef.current?.click(); document.activeElement?.blur(); }}><File size={18} /> Document</a></li>
                <li><a onClick={() => { setIsShareContactOpen(true); document.activeElement?.blur(); }}><User size={18} /> Contact</a></li>
              </ul>
            </div>
            
            {isRecording ? (
              <div className="flex-1 flex items-center bg-base-200 rounded-full px-4 py-2 relative overflow-hidden">
                <button type="button" onClick={cancelRecording} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-error mr-2 z-10">
                  <Trash size={20} />
                </button>
                <div className="flex items-center gap-2 z-10">
                  <div className={`w-2.5 h-2.5 rounded-full bg-error ${isRecordingPaused ? '' : 'animate-pulse'}`} />
                  <span className="font-mono text-sm w-10">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                </div>
                
                {/* Real animated waveform */}
                <div className="flex-1 flex items-center justify-center gap-[2px] mx-2 h-6 opacity-60 z-10">
                  {audioVolumes.map((val, i) => (
                    <div key={i} className="w-1 bg-base-content rounded-full" style={{ height: `${val}px` }} />
                  ))}
                </div>

                <button type="button" onClick={pauseResumeRecording} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-primary z-10">
                  {isRecordingPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
              </div>
            ) : (
              <input type="text" placeholder="Type a message..." className="input input-bordered flex-1 rounded-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50 border-none px-6" value={text} onChange={handleTyping} />
            )}
            
            {!text.trim() && !imagePreview && !videoPreview && !documentPreview && !audioPreview ? (
              isRecording ? (
                <button type="button" onClick={finishAndSendRecording} className="btn bg-[#00a884] hover:bg-[#008f6f] border-none btn-circle shadow-md text-white">
                  <Send size={20} />
                </button>
              ) : (
                <button type="button" onClick={startRecording} className="btn btn-ghost btn-circle text-base-content/60 hover:text-base-content">
                  <Mic size={22} />
                </button>
              )
            ) : (
              <button type="submit" className="btn btn-primary btn-circle shadow-md">
                <Send size={20} />
              </button>
            )}
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
                  togglePinMessage(selectedMessage.id);
                  setSelectedMessage(null);
                }}>
                  <Pin size={18} className={selectedMessage.isPinned ? 'fill-current' : ''} /> 
                  {selectedMessage.isPinned ? 'Unpin message' : 'Pin message'}
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
              {selectedMessage.senderId === authUser?.id && (
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
      {isForwardOpen && (
        <ForwardMessageModal
          isOpen={isForwardOpen}
          onClose={() => {
            setIsForwardOpen(false);
            if (isSelectMode) {
              setIsSelectMode(false);
              setSelectedMessageIds([]);
            }
          }}
          messageIds={isSelectMode ? selectedMessageIds : (selectedMessage ? [selectedMessage.id] : [])}
        />
      )}

      {/* Share Contact Modal */}
      <ShareContactModal
        isOpen={isShareContactOpen}
        onClose={() => setIsShareContactOpen(false)}
        onShare={async (sharedContactId) => {
          await sendMessage({ sharedContactId });
        }}
      />

      {/* Multi Delete Modal */}
      {isMultiDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsMultiDeleteOpen(false)}>
          <div className="bg-base-100 w-full sm:w-96 rounded-2xl shadow-xl overflow-hidden animate-slide-up p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Delete {selectedMessageIds.length} Messages?</h3>
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-error w-full"
                onClick={() => handleDeleteSelected(false)}
              >
                Delete for me
              </button>
              {canDeleteForEveryone && (
                <button
                  className="btn btn-error btn-outline w-full"
                  onClick={() => handleDeleteSelected(true)}
                >
                  Delete for everyone
                </button>
              )}
              <button
                className="btn btn-ghost w-full"
                onClick={() => setIsMultiDeleteOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Confirmation Modals for Blocked State */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[80] flex justify-center items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsConfirmDeleteOpen(false)}>
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl max-w-sm w-full m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">Delete chat?</h3>
            <p className="text-base-content/70 mb-6">Are you sure you want to delete the entire chat history with {selectedUser?.name}? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</button>
              <button className="btn btn-error" onClick={async () => {
                const conversation = useChatStore.getState().conversations.find(c => c.partner?.id === selectedUser.id);
                if (conversation) {
                  await useChatStore.getState().deleteChat(conversation.id);
                }
                setIsConfirmDeleteOpen(false);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          isMine={contextMenu.isMine}
          onClose={() => setContextMenu(null)}
          onReact={(emoji) => reactToMessage(contextMenu.message.id, emoji)}
          onCopyText={() => navigator.clipboard.writeText(contextMenu.message.text)}
          onCopyMediaLink={(url) => navigator.clipboard.writeText(url)}
          onDownloadMedia={(url) => {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.download = true;
            a.click();
          }}
          onPin={() => togglePinMessage(contextMenu.message.id)}
          onReply={() => setReplyingToMessage(contextMenu.message)}
          onForward={() => {
            setSelectedMessage(contextMenu.message);
            setIsForwardOpen(true);
          }}
          onSelect={() => {
            setIsSelectMode(true);
            setSelectedMessageIds([contextMenu.message.id]);
          }}
          onDeleteMe={() => deleteMessage(contextMenu.message.id, false)}
          onDeleteEveryone={() => deleteMessage(contextMenu.message.id, true)}
        />
      )}

      {isConfirmUnblockOpen && (
        <div className="fixed inset-0 z-[80] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsConfirmUnblockOpen(false)}>
          <div className="bg-[#2a2d32] text-white p-6 rounded-2xl shadow-xl max-w-sm w-full m-4 border border-white/5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-8">Unblock {selectedUser?.name}?</h3>
            <div className="flex gap-4 justify-end items-center">
              <button className="text-[#00a884] font-medium hover:bg-white/5 px-4 py-2 rounded-full transition-colors" onClick={() => setIsConfirmUnblockOpen(false)}>Cancel</button>
              <button className="bg-[#00a884] text-[#111b21] font-medium px-6 py-2 rounded-full hover:bg-[#00c299] transition-colors" onClick={async () => {
                await useChatStore.getState().blockContact(selectedUser.id);
                setIsConfirmUnblockOpen(false);
              }}>Unblock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
