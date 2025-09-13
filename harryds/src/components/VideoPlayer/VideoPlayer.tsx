import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.scss';

export interface VideoPlayerProps {
  /** 影片來源 URL */
  src: string;
  /** 預覽圖片（poster） */
  poster?: string;
  /** 替代文字 */
  alt?: string;
  /** 是否自動播放 */
  autoplay?: boolean;
  /** 是否循環播放 */
  loop?: boolean;
  /** 是否靜音 */
  muted?: boolean;
  /** 是否顯示控制項 */
  controls?: boolean;
  /** 額外 CSS 類名 */
  className?: string;
  /** 影片載入完成回調 */
  onLoad?: () => void;
  /** 影片載入錯誤回調 */
  onError?: (error: Event) => void;
  /** 影片開始播放回調 */
  onPlay?: () => void;
  /** 影片暫停回調 */
  onPause?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  alt,
  autoplay = false,
  loop = false,
  muted = true,
  controls = true,
  className,
  onLoad,
  onError,
  onPlay,
  onPause,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // 當影片元數據載入時立即更新尺寸
      setIsLoading(false);
      onLoad?.();
    };

    const handleError = (event: Event) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(event);
    };

    const handlePlay = () => {
      onPlay?.();
    };

    const handlePause = () => {
      onPause?.();
    };

    // 使用 loadedmetadata 而不是 loadeddata 來更早觸發尺寸計算
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onLoad, onError, onPlay, onPause]);

  if (hasError) {
    return (
      <div className={`hds-video-player hds-video-player--error ${className || ''}`}>
        <div className="hds-video-player__error">
          <p>影片載入失敗</p>
          {alt && <p className="hds-video-player__alt">{alt}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`hds-video-player ${className || ''}`}>
      {isLoading && (
        <div className="hds-video-player__loading">
          <p>載入中...</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="hds-video-player__video"
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        preload="metadata"
        aria-label={alt}
      >
        <p>
          您的瀏覽器不支援影片播放。
          <a href={src} download>
            請點此下載影片
          </a>
        </p>
      </video>
    </div>
  );
};
