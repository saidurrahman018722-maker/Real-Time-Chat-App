import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const ChatPage = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-base-100">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatPage;
