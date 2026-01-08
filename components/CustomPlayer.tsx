import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Zap, ZoomIn, ZoomOut, Volume2, VolumeX } from 'lucide-react';

interface CustomPlayerProps {
    videoUrl: string;
    onEnded?: () => void;
}

export const CustomPlayer: React.FC<CustomPlayerProps> = ({ videoUrl, onEnded }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    
    // Helper to send commands to YouTube Iframe
    const sendCommand = (func: string, args: any[] = []) => {
        if (!iframeRef.current) return;
        iframeRef.current.contentWindow?.postMessage(JSON.stringify({
            event: 'command',
            func: func,
            args: args
        }), '*');
    };

    const togglePlay = () => {
        if (isPlaying) sendCommand('pauseVideo');
        else sendCommand('playVideo');
        setIsPlaying(!isPlaying);
    };

    const changeSpeed = () => {
        const speeds = [0.5, 1, 1.5, 2];
        const idx = speeds.indexOf(speed);
        const nextSpeed = speeds[(idx + 1) % speeds.length];
        setSpeed(nextSpeed);
        sendCommand('setPlaybackRate', [nextSpeed]);
    };

    const toggleZoom = () => {
         setZoom(zoom === 1 ? 1.25 : 1);
    };

    const toggleMute = () => {
        if (isMuted) sendCommand('unMute');
        else sendCommand('mute');
        setIsMuted(!isMuted);
    };

    // Fullscreen logic
    const toggleFullscreen = () => {
        const container = iframeRef.current?.parentElement?.parentElement; // Get the wrapper div
        if (!document.fullscreenElement) {
            container?.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    // Embed URL generation
    const getEmbedUrl = (url: string) => {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
        
        // enablejsapi=1 is crucial for postMessage
        // controls=0 hides native controls
        // modestbranding=1 reduces logo
        // rel=0 prevents related videos from other channels
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0`;
    };

    return (
        <div 
            className="relative w-full h-full bg-black group overflow-hidden select-none" 
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
             {/* IFRAME WRAPPER FOR ZOOM */}
             <div className="w-full h-full transition-transform duration-300 ease-out origin-center" style={{ transform: `scale(${zoom})` }}>
                <iframe 
                    ref={iframeRef}
                    src={getEmbedUrl(videoUrl)} 
                    className="w-full h-full pointer-events-none" // Block clicks on iframe (Strict Pro Mode)
                    allow="autoplay; encrypted-media; fullscreen" 
                    title="Video Player"
                />
             </div>

             {/* CLICK OVERLAY (To Toggle Play/Pause) */}
             <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={togglePlay}
             ></div>

             {/* NSTA BRANDING - Bottom Right (Covering YouTube Logo) */}
             <div className="absolute bottom-16 right-4 z-20 pointer-events-none opacity-80 bg-black/50 px-3 py-1 rounded backdrop-blur-sm border border-white/10">
                 <span className="text-white font-black tracking-[0.3em] text-sm">NSTA</span>
             </div>

             {/* CUSTOM CONTROLS BAR */}
             <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-8 z-30 flex items-center gap-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                 
                 {/* Play/Pause */}
                 <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-blue-400 transition hover:scale-110">
                     {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                 </button>

                 {/* Volume */}
                 <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white/80 hover:text-white transition">
                     {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                 </button>

                 {/* Spacer / Progress (Mocked as simple bar for now since we don't sync state) */}
                 <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden mx-4">
                     {/* We can't easily show progress without receiving events, so just a static track for pro look */}
                     <div className="h-full bg-blue-500 w-full opacity-30 animate-pulse"></div> 
                 </div>

                 {/* SPEED */}
                 <button onClick={(e) => { e.stopPropagation(); changeSpeed(); }} className="text-white text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 flex items-center gap-1 transition border border-white/10">
                     <Zap size={14} className={speed > 1 ? "text-yellow-400" : "text-white"} /> {speed}x
                 </button>

                 {/* ZOOM */}
                 <button onClick={(e) => { e.stopPropagation(); toggleZoom(); }} className="text-white hover:text-blue-400 transition p-2 hover:bg-white/10 rounded-full" title="Zoom/Fit">
                     {zoom === 1 ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
                 </button>

                 {/* FULLSCREEN */}
                 <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white hover:text-blue-400 transition p-2 hover:bg-white/10 rounded-full">
                     <Maximize size={20} />
                 </button>
             </div>
        </div>
    );
};
