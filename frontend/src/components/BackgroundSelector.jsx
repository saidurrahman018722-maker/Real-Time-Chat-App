import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const BACKGROUNDS = [
  "bg-base-200", // Default
  "bg-gradient-to-r from-cyan-500 to-blue-500",
  "bg-gradient-to-r from-purple-500 to-pink-500",
  "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
  "bg-gradient-to-t from-orange-400 to-rose-400",
  "bg-gradient-to-bl from-emerald-500 to-teal-400",
  "bg-gradient-to-r from-slate-900 to-slate-700",
  "bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop')]",
  "bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=600&auto=format&fit=crop')]",
  "bg-[url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop')]",
  "bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop')]"
];

const BackgroundSelector = ({ conversationId }) => {
  const [bgClass, setBgClass] = useState(BACKGROUNDS[0]);

  // Load saved background for this specific conversation
  useEffect(() => {
    if (!conversationId) return;
    const saved = localStorage.getItem(`chat_bg_${conversationId}`);
    if (saved) {
      setBgClass(saved);
      // Emit an event or set it in a store so the parent can use it.
      // For simplicity here, we dispatch a custom event on window
      window.dispatchEvent(new CustomEvent('chatBgChanged', { 
        detail: { conversationId, bgClass: saved } 
      }));
    } else {
      setBgClass(BACKGROUNDS[0]);
      window.dispatchEvent(new CustomEvent('chatBgChanged', { 
        detail: { conversationId, bgClass: BACKGROUNDS[0] } 
      }));
    }
  }, [conversationId]);

  const selectBg = (bg) => {
    setBgClass(bg);
    localStorage.setItem(`chat_bg_${conversationId}`, bg);
    window.dispatchEvent(new CustomEvent('chatBgChanged', { 
      detail: { conversationId, bgClass: bg } 
    }));
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
        <ImageIcon size={20} />
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-4 shadow-2xl bg-base-100 rounded-box w-72">
        <li className="menu-title mb-2">Chat Wallpaper</li>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUNDS.map((bg, idx) => (
            <div 
              key={idx}
              className={`h-16 rounded-lg cursor-pointer border-2 bg-cover bg-center ${bgClass === bg ? 'border-primary' : 'border-transparent'} ${bg}`}
              onClick={() => selectBg(bg)}
            ></div>
          ))}
        </div>
      </ul>
    </div>
  );
};

export default BackgroundSelector;
