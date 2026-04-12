import React, { useState, useEffect } from 'react';
import { Youtube, ExternalLink } from 'lucide-react';

const YouTubeVideos = ({ focus }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const fetchVideos = async () => {
      if (!apiKey || !focus) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(focus + " tutorial for beginners")}&type=video&maxResults=3&relevanceLanguage=en&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.items) {
          setVideos(data.items);
        }
      } catch (err) {
        console.error("YouTube API failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [focus, apiKey]);

  if (loading || videos.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-indigo-500/10">
      <div className="flex items-center gap-2 mb-4">
        <Youtube className="text-red-500 w-5 h-5" />
        <h4 className="text-sm font-bold text-slate-200">Watch & Learn</h4>
      </div>
      
      <div className="space-y-3">
        {videos.map((vid) => (
          <a 
            key={vid.id.videoId}
            href={`https://www.youtube.com/watch?v=${vid.id.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="relative w-24 h-14 shrink-0 rounded-lg overflow-hidden border border-white/10">
              <img 
                src={vid.snippet.thumbnails.default.url} 
                alt={vid.snippet.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 className="text-[13px] font-semibold text-slate-200 line-clamp-1 leading-tight mb-1 group-hover:text-indigo-400">
                {vid.snippet.title}
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                {vid.snippet.channelTitle}
              </p>
            </div>
            
            <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default YouTubeVideos;
