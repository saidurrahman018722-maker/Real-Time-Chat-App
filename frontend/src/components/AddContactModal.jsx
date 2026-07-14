import { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const AddContactModal = ({ isOpen, onClose }) => {
  const { searchUsers, addContact } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchUsers(query);
      setResults(data);
      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleAddContact = async (userId) => {
    setAddingUserId(userId);
    const res = await addContact(userId);
    setAddingUserId(null);
    if (res.success) {
      setSuccessMessage('Contact added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setSuccessMessage(res.message);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md bg-base-100">
        <button 
          onClick={onClose} 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X size={20} />
        </button>
        
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-primary" /> Add New Contact
        </h3>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="input input-bordered w-full pl-10 bg-base-200 focus:input-primary transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {successMessage && (
          <div className={`alert ${successMessage.includes('success') ? 'alert-success' : 'alert-error'} mb-4 p-2 text-sm`}>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isSearching && (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}
          
          {!isSearching && query.trim() && results.length === 0 && (
            <div className="text-center p-4 text-base-content/50">
              No users found matching "{query}"
            </div>
          )}

          {!isSearching && results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  {user.profilePic ? (
                    <div className="w-10 rounded-full">
                      <img src={user.profilePic} alt={user.name} />
                    </div>
                  ) : (
                    <div className="bg-neutral text-neutral-content w-10 rounded-full">
                      <span className="text-sm">{user.name?.charAt(0) || user.email?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{user.name}</span>
                  <span className="text-xs text-base-content/60">{user.email}</span>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => handleAddContact(user.id)}
                disabled={addingUserId === user.id}
              >
                {addingUserId === user.id ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default AddContactModal;
