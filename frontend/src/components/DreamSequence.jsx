import React, { useState } from 'react';
import './DreamSequence.css';

function DreamSequence({ sparks }) {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  return (
    <div className="dream-gallery-container">
      <div className="gallery-header">
        <h2>Subconscious Visualizations</h2>
        <p className="label-mono">Live render from Semantic Memory Sparks (Generative Module)</p>
      </div>
      
      {sparks.length === 0 ? (
        <div className="empty-gallery">
          <p className="label-mono" style={{ opacity: 0.5 }}>Awaiting neural sparks during deep idle cycles...</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {sparks.map((spark, idx) => {
            // Seed avoids caching issues, nologo removes watermark
            const prompt = `Sci-Fi cinematic lighting, neon cyberpunk, highly detailed digital concept art of: ${spark.content}`;
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${new Date(spark.timestamp).getTime()}`;
            
            return (
              <div key={idx} className="dream-card" onClick={() => setFullscreenImage(imgUrl)}>
                <div className="image-wrapper">
                  <img src={imgUrl} alt="Neural Dream" loading="lazy" />
                  <div className="image-overlay">
                    <span className="label-mono zoom-icon">⤢</span>
                  </div>
                </div>
                <div className="dream-meta">
                  <span className="spark-time label-mono">[{new Date(spark.timestamp).toLocaleTimeString()}]</span>
                  <p className="spark-text">{spark.content}</p>
                  <div className="spark-tags">
                    {spark.entities.map(e => <span key={e} className="label-mono entity-tag">#{e}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {fullscreenImage && (
        <div className="lightbox" onClick={() => setFullscreenImage(null)}>
          <div className="lightbox-content">
            <span className="close-btn label-mono">✕ CLOSE</span>
            <img src={fullscreenImage} alt="Fullscreen Dream" />
          </div>
        </div>
      )}
    </div>
  );
}

export default DreamSequence;
