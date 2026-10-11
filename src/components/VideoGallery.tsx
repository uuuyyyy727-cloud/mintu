import React, { useState } from 'react';
import { VideoItem, CreatorProfile, User, YouTubeChannelData } from '../types';
import { 
  Play, 
  ExternalLink, 
  Share2, 
  Check, 
  Radio, 
  Youtube, 
  Clock, 
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';

interface VideoGalleryProps {
  videos: VideoItem[];
  creator: CreatorProfile;
  currentUser: User;
  onJoinTier: () => void;
  youtubeData: YouTubeChannelData | null;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  creator,
  youtubeData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Parse real uploaded videos from genuine YouTube data
  const realVideos = youtubeData?.latestVideos && youtubeData.latestVideos.length > 0
    ? youtubeData.latestVideos
    : [];

  const categories = ['All', 'Uploads', 'Shorts'];

  const filteredVideos = realVideos.filter((v) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Shorts') return v.isShort;
    if (selectedCategory === 'Uploads') return !v.isShort;
    return true;
  });

  const featuredVideo = realVideos.length > 0 ? realVideos[0] : null;

  function handleShare() {
    navigator.clipboard.writeText('https://youtube.com/@vg_alphax');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Featured Livestream / Latest Broadcast Card */}
      <div className="relative rounded-2xl overflow-hidden bg-[#090e21] border border-purple-500/40 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          
          {/* Stream Visual Preview */}
          <div className="lg:col-span-7 relative aspect-video bg-black overflow-hidden group">
            {youtubeData?.isLive && youtubeData.liveStream ? (
              <img
                src={youtubeData.liveStream.thumbnailUrl}
                alt={youtubeData.liveStream.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : featuredVideo ? (
              <img
                src={featuredVideo.thumbnailUrl}
                alt={featuredVideo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img
                src="/src/assets/images/hero_esports_alphax_1791703225410.jpg"
                alt="VG ALPHAX Channel"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-center justify-center">
              <button
                onClick={() => {
                  if (youtubeData?.isLive && youtubeData.liveStream) {
                    setActiveVideoId(youtubeData.liveStream.videoId);
                  } else if (featuredVideo) {
                    setActiveVideoId(featuredVideo.id);
                  }
                }}
                className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-red-900/80"
                title="Play Video"
              >
                <Play className="w-8 h-8 fill-white ml-1" />
              </button>
            </div>

            {/* Live Indicator overlay badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {youtubeData?.isLive ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  LIVE NOW ON YOUTUBE
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  OFFLINE · LATEST UPLOAD
                </span>
              )}
            </div>
          </div>

          {/* Stream Metadata & Actions */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-950/80 text-red-300 font-bold px-2 py-0.5 rounded border border-red-800/50 flex items-center gap-1">
                <Youtube className="w-3 h-3 text-red-400" />
                @vg_alphax
              </span>
              <span className="text-xs text-slate-400">Official YouTube Channel</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] leading-tight">
              {youtubeData?.isLive && youtubeData.liveStream
                ? youtubeData.liveStream.title
                : featuredVideo
                ? featuredVideo.title
                : 'VG ALPHAX YouTube Hub'}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {youtubeData?.isLive
                ? 'VG ALPHAX is streaming live right now! Join the stream on YouTube for custom room clash squads and live rank push.'
                : 'Catch the latest official Free Fire MAX gameplay, clutches, and custom rooms directly from @vg_alphax.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {youtubeData?.isLive ? (
                <a
                  href="https://youtube.com/@vg_alphax/live"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2 shadow-lg shadow-red-950/60"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Watch Live Stream</span>
                </a>
              ) : (
                <button
                  onClick={() => featuredVideo && setActiveVideoId(featuredVideo.id)}
                  disabled={!featuredVideo}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Latest Upload</span>
                </button>
              )}

              <a
                href="https://youtube.com/@vg_alphax"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#0e162f] border border-slate-700 hover:border-purple-500 hover:text-white flex items-center gap-1.5"
              >
                <span>Visit YouTube Channel</span>
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </a>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl text-slate-300 bg-[#0e162f] border border-slate-700 hover:text-white"
                title="Share Channel Link"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Real Uploads Gallery */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-white font-['Outfit']">
                Latest Videos from @vg_alphax
              </h3>
              <span className="text-[10px] bg-purple-950/80 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-800/50">
                GENUINE YOUTUBE FEED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Synced directly from channel <strong className="text-slate-300">UCa5uZImNOQZAT5OywD2a45w</strong>. Zero fabricated video titles.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0a0f22] rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Video Cards Grid */}
        {filteredVideos.length === 0 ? (
          <div className="p-8 bg-[#0a0f22] border border-slate-800 rounded-2xl text-center space-y-2">
            <Info className="w-6 h-6 text-purple-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Videos in this Category</h4>
            <p className="text-xs text-slate-400">Switch filter to 'All' to browse all uploads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setActiveVideoId(video.id)}
                className="group bg-[#0a0f22] border border-slate-800 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Short Tag */}
                    {video.isShort && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 text-white font-black text-[10px] flex items-center gap-1">
                        SHORTS
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title and Details */}
                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                      Free Fire MAX
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                      {video.title}
                    </h4>
                  </div>
                </div>

                <div className="p-4 pt-0 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(video.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal Player */}
      {activeVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-[#090e21] border border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0e162f] border-b border-purple-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pr-4">
                <Play className="w-4 h-4 text-red-500 shrink-0" />
                <h4 className="font-bold text-white text-sm truncate font-['Outfit']">
                  Playing from YouTube @vg_alphax
                </h4>
              </div>
              <button
                onClick={() => setActiveVideoId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title="YouTube Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
