import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useChatStore } from '../store/useChatStore';
import { LogOut, User, Image as ImageIcon, Send, ArrowLeft, Settings, Palette, Image as MediaIcon, CheckCircle2, AlertCircle, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
  "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black",
  "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade",
  "night", "coffee", "winter", "dim", "nord", "sunset"
];

const SettingsPage = () => {
  const { authUser, logout, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { sharedMediaGlobal, getSharedMediaGlobal, isMediaLoading } = useChatStore();
  
  const [activeTab, setActiveTab] = useState('account');
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [profilePic, setProfilePic] = useState(null);
  const [contactEmail, setContactEmail] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setUpdateMessage('Email successfully verified! Your new email is active.');
      // remove query param without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('verified') === 'false') {
      setUpdateMessage('Email verification failed or link expired.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  useEffect(() => {
    if (updateMessage && updateMessage !== 'Updating...') {
      const timer = setTimeout(() => {
        setUpdateMessage('');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [updateMessage]);

  useEffect(() => {
    if (activeTab === 'media') {
      getSharedMediaGlobal();
    }
  }, [activeTab, getSharedMediaGlobal]);

  // Handle clicking outside the mobile dropdown menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdown = document.getElementById('settings-mobile-menu');
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.removeAttribute('open');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMessage('Updating...');
    
    const payload = { name };
    if (email !== authUser?.email) payload.email = email;
    if (profilePic) payload.profilePic = profilePic;

    const res = await updateProfile(payload);
    if (res) {
      setUpdateMessage(res.message);
    }
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    console.log("Adding contact", contactEmail);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'general', label: 'General Settings', icon: <Settings size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette size={18} /> },
    { id: 'media', label: 'Media', icon: <MediaIcon size={18} /> },
  ];

  if (!authUser) return null;

  return (
    <div className="h-screen flex flex-col bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4 sticky top-0 z-20">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost btn-circle">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold ml-2">Settings</h1>
        </div>
        <div className="flex-none md:hidden">
          <details className="dropdown dropdown-end" id="settings-mobile-menu">
            <summary className="btn btn-ghost btn-circle list-none [&::-webkit-details-marker]:hidden">
              <Menu size={24} />
            </summary>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 gap-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <a 
                    className={activeTab === tab.id ? 'active' : ''} 
                    onClick={() => {
                      setActiveTab(tab.id);
                      const dropdown = document.getElementById('settings-mobile-menu');
                      if(dropdown) dropdown.removeAttribute('open');
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-6xl w-full mx-auto p-4 gap-6 flex-col md:flex-row">
        
        {/* Sidebar Navigation - Desktop Only */}
        <div className="hidden md:block w-64 flex-shrink-0 bg-base-100 rounded-box p-4 shadow-sm h-fit">
          <ul className="menu menu-vertical w-full gap-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <a 
                  className={activeTab === tab.id ? 'active' : ''} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-base-100 rounded-box p-6 shadow-sm">
          
          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
                  <User className="text-primary" /> Profile Settings
                </h2>
                <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4">
                    <div className="avatar">
                      <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                        <img src={profilePic || authUser?.profilePic || "https://api.dicebear.com/9.x/notionists/svg?seed=Felix"} alt="Profile" className="object-cover" />
                      </div>
                    </div>
                    <label className="btn btn-outline btn-sm">
                      <ImageIcon size={16} className="mr-2" /> Change Picture
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    {updateMessage && (
                      <div className="alert alert-info py-2 shadow-sm">
                        <span>{updateMessage}</span>
                      </div>
                    )}
                    <div className="form-control">
                      <label className="label"><span className="label-text">Display Name</span></label>
                      <input type="text" className="input input-bordered w-full focus:input-primary transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text flex items-center gap-2">
                          Email Address
                          {authUser?.verified ? (
                            <div className="badge badge-success gap-1 text-xs px-2 py-3"><CheckCircle2 size={12}/> Verified</div>
                          ) : (
                            <div className="badge badge-error gap-1 text-xs px-2 py-3"><AlertCircle size={12}/> Not Verified</div>
                          )}
                        </span>
                      </label>
                      <input type="email" className="input input-bordered w-full focus:input-primary transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} />
                      {!authUser?.verified && (
                        <label className="label"><span className="label-text-alt text-error">Please check your email to verify your account.</span></label>
                      )}
                      <label className="label"><span className="label-text-alt text-base-content/60">Changing your email will require verification again.</span></label>
                    </div>
                    
                    <div className="form-control mt-4">
                      <label className="label"><span className="label-text">Security</span></label>
                      <Link to="/change-password" className="btn btn-outline btn-block">Change Password</Link>
                    </div>

                    <button type="submit" className="btn btn-primary mt-6 shadow-sm">Update Profile</button>
                  </div>
                </form>
              </section>

              {/* Danger Zone */}
              <section className="mt-8 pt-8 border-t border-error/20">
                <h2 className="text-xl font-bold text-error mb-4">Account Actions</h2>
                <p className="text-base-content/70 mb-4 text-sm">You can log out of your session on this device. This will end your active session.</p>
                <button className="btn btn-error btn-outline" onClick={logout}>
                  <LogOut size={18} className="mr-2" /> Log Out
                </button>
              </section>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
                  <Settings className="text-primary" /> General Settings
                </h2>
                
                <div className="form-control w-full max-w-md">
                  <label className="label">
                    <span className="label-text font-semibold">Add Contact by Email</span>
                  </label>
                  <form onSubmit={handleAddContact} className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Enter contact's email..." 
                      className="input input-bordered flex-1 focus:input-primary transition-colors"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      <Send size={18} className="mr-2" /> Add
                    </button>
                  </form>
                  <p className="text-xs text-base-content/60 mt-2">
                    The user must be registered in the system before you can add them.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
                  <Palette className="text-primary" /> My Color Scheme
                </h2>
                <p className="text-base-content/70 mb-6">Choose a theme to personalize your ChatWave experience. The theme will be saved to your device.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {THEMES.map((t) => (
                    <button 
                      key={t}
                      className={`btn ${theme === t ? 'btn-primary shadow-md' : 'btn-ghost border border-base-300'} capitalize justify-start`}
                      onClick={() => setTheme(t)}
                    >
                      <div className="flex gap-1 mr-2" data-theme={t}>
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                        <div className="w-3 h-3 rounded-full bg-accent"></div>
                      </div>
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Media Settings Tab */}
          {activeTab === 'media' && (
            <div className="bg-base-100 rounded-3xl p-6 sm:p-10 shadow-xl border border-base-200/50 animate-fade-in relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <MediaIcon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Shared Media</h2>
                  <p className="text-base-content/60">View all images shared across your conversations</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[400px]">
                {isMediaLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : sharedMediaGlobal.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-base-content/50 gap-4 mt-12">
                    <MediaIcon size={64} className="opacity-20" />
                    <p className="text-lg">You haven't shared any media yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                    {sharedMediaGlobal.map((msg) => (
                      <div key={msg.id} className="aspect-square bg-base-200 rounded-xl overflow-hidden group relative shadow-sm border border-base-300">
                        <img 
                          src={msg.image} 
                          alt="Shared media" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                          <span className="text-white text-xs font-medium truncate">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
