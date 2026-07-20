import { useState, useRef, useEffect } from 'react';
import { Play, Pause, User, Mic } from 'lucide-react';

// Pre-generated static waveform data (values between 2 and 10)
const waveformData = [
  3, 4, 3, 5, 8, 5, 4, 3, 6, 9, 12, 10, 8, 6, 4, 5, 7, 9, 7, 5, 3, 4, 5, 4, 3, 2, 3, 4, 6, 4, 3, 2
];

const VoiceMessagePlayer = ({ src, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let isWorkaround = false;

    const setAudioData = () => {
      if (audio.duration === Infinity) {
        isWorkaround = true;
        audio.currentTime = 1e6;
        const fixDuration = () => {
          setDuration(audio.duration);
          audio.currentTime = 0;
          isWorkaround = false;
          audio.removeEventListener('timeupdate', fixDuration);
        };
        audio.addEventListener('timeupdate', fixDuration);
      } else {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => {
      if (!isWorkaround && audio.duration > 0 && audio.duration !== Infinity) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onAudioEnd = () => {
      if (isWorkaround) return;
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);

    if (audio.readyState > 0) setAudioData();

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
    };
  }, [src]);

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const togglePlaybackRate = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    
    setPlaybackRate(nextRate);
    if (audio) audio.playbackRate = nextRate;
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const seekTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // WhatsApp-like styling colors
  const trackColor = isMine ? 'bg-primary-content/30' : 'bg-base-content/20';
  const progressColor = isMine ? 'bg-[#34B7F1]' : 'bg-primary'; // WhatsApp cyan for progress
  const textColor = isMine ? 'text-primary-content/80' : 'text-base-content/70';

  return (
    <div className={`flex items-center gap-3 w-full min-w-[200px] max-w-[250px]`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Avatar Container with overlapping Mic icon */}
      <div className="relative shrink-0 mt-1">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isMine ? 'bg-[#0b141a] text-[#53bdeb]' : 'bg-base-300 text-base-content/70'}`}>
          <User size={24} strokeWidth={2.5} />
        </div>
        <div className={`absolute -bottom-0.5 -right-1 flex items-center justify-center text-[#25D366]`}>
          <Mic size={14} fill="currentColor" strokeWidth={0} />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button 
        onClick={togglePlayPause} 
        className={`btn btn-ghost btn-circle btn-sm p-0 min-h-0 h-8 w-8 hover:bg-transparent ${isMine ? 'text-primary-content' : 'text-base-content'}`}
      >
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
      </button>

      {/* Waveform and Time container */}
      <div className="flex-1 flex flex-col justify-center relative h-12 ml-1">
        
        {/* Waveform visualization */}
        <div className="flex items-center justify-between h-6 w-full pointer-events-none mt-2 px-1">
          {waveformData.map((val, i) => {
             const isPlayed = (i / waveformData.length) * 100 <= progress;
             return (
               <div 
                 key={i} 
                 className={`flex-1 max-w-[2.5px] rounded-full transition-colors duration-150 ${isPlayed ? progressColor : trackColor}`} 
                 style={{ height: `${val * 2}px`, margin: '0 1px' }} 
               />
             );
          })}
          
          {/* Scrub dot overlay */}
          <div 
            className={`absolute w-3.5 h-3.5 rounded-full shadow-sm ${progressColor} top-4 -translate-y-1/2 transition-all duration-75`}
            style={{ left: `calc(${progress || 0}% - 7px)` }}
          />
        </div>
        
        {/* Invisible Range Slider for native interaction */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress || 0} 
          onChange={handleSeek}
          className="w-full h-8 opacity-0 cursor-pointer absolute top-2 z-10" 
        />
        
        <div className={`text-[11px] font-medium tracking-wide mt-1 ${textColor}`}>
          {formatTime(audioRef.current?.currentTime)}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
