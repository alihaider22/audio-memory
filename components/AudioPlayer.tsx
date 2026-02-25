"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export default function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const progress = duration > 0 ? currentTime / duration : 0;

  // SVG circle math
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - progress * circumference;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", onDurationChange);
    audio.addEventListener("ended", onEnded);

    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = Number(e.target.value);
    audio.volume = vol;
    setVolume(vol);
    if (vol > 0 && muted) {
      audio.muted = false;
      setMuted(false);
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }

  function formatTime(seconds: number) {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <style>{`
        @keyframes soundbar1 { 0%, 100% { height: 6px } 50% { height: 20px } }
        @keyframes soundbar2 { 0%, 100% { height: 10px } 50% { height: 28px } }
        @keyframes soundbar3 { 0%, 100% { height: 14px } 50% { height: 22px } }
        @keyframes soundbar4 { 0%, 100% { height: 8px } 50% { height: 26px } }
        @keyframes soundbar5 { 0%, 100% { height: 12px } 50% { height: 18px } }
        .soundbar { border-radius: 9999px; width: 3px; background: var(--primary); }
        .sb1 { animation: soundbar1 0.8s ease-in-out infinite; }
        .sb2 { animation: soundbar2 0.7s ease-in-out infinite 0.1s; }
        .sb3 { animation: soundbar3 0.9s ease-in-out infinite 0.2s; }
        .sb4 { animation: soundbar4 0.75s ease-in-out infinite 0.05s; }
        .sb5 { animation: soundbar5 0.85s ease-in-out infinite 0.15s; }
        .progress-ring { transition: stroke-dashoffset 0.3s ease; }
        .seek-track {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer;
        }
        .seek-track::-webkit-slider-runnable-track {
          height: 6px; border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--primary) 0%,
            var(--primary) var(--progress),
            var(--muted) var(--progress),
            var(--muted) 100%
          );
        }
        .seek-track::-moz-range-track {
          height: 6px; border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--primary) 0%,
            var(--primary) var(--progress),
            var(--muted) var(--progress),
            var(--muted) 100%
          );
        }
        .seek-track::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--primary); border: 3px solid var(--card);
          margin-top: -5px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .seek-track::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--primary); border: 3px solid var(--card);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .vol-track {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer;
        }
        .vol-track::-webkit-slider-runnable-track {
          height: 4px; border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--primary) 0%,
            var(--primary) var(--vol-progress),
            var(--muted) var(--vol-progress),
            var(--muted) 100%
          );
        }
        .vol-track::-moz-range-track {
          height: 4px; border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--primary) 0%,
            var(--primary) var(--vol-progress),
            var(--muted) var(--vol-progress),
            var(--muted) 100%
          );
        }
        .vol-track::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--primary); border: 2px solid var(--card);
          margin-top: -5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .vol-track::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--primary); border: 2px solid var(--card);
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
      `}</style>

      <div
        className="relative overflow-hidden bg-card border border-border rounded-3xl shadow-xl"
        style={{
          boxShadow:
            "0 4px 24px -4px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Decorative top gradient band */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--primary) 0%, var(--chart-2) 50%, var(--primary) 100%)",
          }}
        />

        <div className="px-8 pt-8 pb-6">
          {/* Circular play button with progress ring */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Background ring */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 200 200"
              >
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="4"
                  opacity={0.5}
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="progress-ring"
                />
              </svg>

              {/* Inner disc */}
              <button
                onClick={togglePlay}
                className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                style={{
                  background:
                    "radial-gradient(circle at 40% 35%, var(--secondary), var(--muted))",
                  boxShadow:
                    "inset 0 2px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {/* Vinyl-style grooves */}
                <div
                  className="absolute inset-3 rounded-full border border-border/30"
                  style={{ borderStyle: "dashed" }}
                />
                <div className="absolute inset-6 rounded-full border border-border/20" />

                {isPlaying ? (
                  /* Animated sound bars */
                  <div className="flex items-center gap-[3px] h-8">
                    <div className="soundbar sb1" />
                    <div className="soundbar sb2" />
                    <div className="soundbar sb3" />
                    <div className="soundbar sb4" />
                    <div className="soundbar sb5" />
                  </div>
                ) : (
                  <svg
                    className="w-10 h-10 text-primary ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                )}
              </button>
            </div>

            {/* Title */}
            <div className="text-center mt-2">
              <h2
                className="text-xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-geist-sans), var(--font-sans)" }}
              >
                Audio Memory
              </h2>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                {isPlaying ? "Now playing" : "Press to play"}
              </p>
            </div>
          </div>

          <audio ref={audioRef} src={audioUrl} preload="auto" />

          {/* Seek bar */}
          <div className="mb-2">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="seek-track w-full h-6"
              style={
                {
                  "--progress": `${progress * 100}%`,
                } as React.CSSProperties
              }
            />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground -mt-1 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 my-4" />

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {muted || volume === 0 ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="vol-track flex-1 h-4"
              style={
                {
                  "--vol-progress": `${(muted ? 0 : volume) * 100}%`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
