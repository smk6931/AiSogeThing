import { X } from 'lucide-react';
import './YoutubePlayer.css';

export default function YoutubePlayer({ videoId, onClose }) {
  if (!videoId) return null;

  return (
    <div className="youtube-modal-overlay" onClick={onClose}>
      <div className="youtube-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="youtube-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="youtube-iframe-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
