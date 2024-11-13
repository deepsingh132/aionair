/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { formatTime } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/AudioProvider";
import useIncrementPodcastViews from "@/hooks/useIncrementPodcastViews";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useClerk } from "@clerk/nextjs";
import { Slider } from "./ui/slider";

const PLAY_TIME_REQUIRED_FOR_VIEW_IN_SECONDS = 10;

const PodcastPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const { audio, setAudio } = useAudio();
  const { isViewValid, setResetTimer } = useIncrementPodcastViews({
    targetTime: PLAY_TIME_REQUIRED_FOR_VIEW_IN_SECONDS,
    isPlaying: isPlaying,
    duration: audioRef?.current?.duration ?? 0,
  });
  const incrementViews = useMutation(api.podcasts.incrementPodcastViews);
  const { user } = useClerk();

  const togglePlayPause = () => {
    if (audioRef.current?.paused) {
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const forward = () => {
    if (
      audioRef.current &&
      audioRef.current.currentTime &&
      audioRef.current.duration &&
      audioRef.current.currentTime + 5 < audioRef.current.duration
    ) {
      audioRef.current.currentTime += 5;
    }
  };

  const rewind = () => {
    if (audioRef.current && audioRef.current.currentTime - 5 > 0) {
      audioRef.current.currentTime -= 5;
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const updateCurrentTime = () => setCurrentTime(audioElement.currentTime);

    audioElement.addEventListener("timeupdate", updateCurrentTime);

    return () => {
      audioElement.removeEventListener("timeupdate", updateCurrentTime);
    };
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (!audio?.audioUrl) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }
    audioElement.play().then(() => setIsPlaying(true));
  }, [audio]);
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handlePlayerClose = () => {
    setAudio(undefined);
    setIsPlaying(false);
    setResetTimer();
  };

  const handleVolumeChange = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = value / 100;
    audioRef.current.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const handleProgressChange = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  // set the volume to 0 when the audio is muted and vice versa
  useEffect(() => {
    if (!audioRef.current) return;
    setVolume(isMuted ? 0 : 100);
  }, [isMuted]);

  // set the volume and muted state when the volume or muted state changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  // increment views if user is not the author of the podcast
  useEffect(() => {
    if (!audio || !user || audio.authorId === user.id) return;
    if (audio.podcastId && isViewValid) {
      incrementViews({ podcastId: audio.podcastId as Id<"podcasts"> });
    }
  }, [isViewValid]);

  // reset the timer when the audio changes
  useEffect(() => {
    setResetTimer();
  }, [audio]);

  return (
    <div
      className={cn("sticky bottom-0 left-0 flex size-full flex-col", {
        hidden: !audio?.audioUrl || audio?.audioUrl === "",
      })}
    >
      <section className="glassmorphism-black relative flex h-[112px] w-full items-center justify-between px-4 max-md:justify-center md:gap-5 md:px-12">
        <audio
          ref={audioRef}
          src={audio?.audioUrl}
          className="hidden"
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />

        <div className="flex items-center gap-4 max-md:hidden">
          <Link href={`/podcasts/${audio?.podcastId}`}>
            <Image
              src={audio?.imageUrl! || "/images/player1.png"}
              width={64}
              height={64}
              alt="player1"
              className="aspect-square rounded-xl"
            />
          </Link>
          <div className="flex w-[160px] flex-col">
            <h2 className="text-14 truncate font-semibold text-white-1">
              {audio?.title}
            </h2>
            <p className="text-12 font-normal text-white-2">{audio?.author}</p>
          </div>
        </div>
        <div className="flex-center w-full max-w-[600px] flex-col gap-3">
          <div className="flex items-center cursor-pointer gap-3 md:gap-6">
            <div className="flex items-center gap-1.5">
              <Image
                src={"/icons/reverse.svg"}
                width={24}
                height={24}
                alt="rewind"
                onClick={rewind}
                aria-label="Rewind"
              />
              <h2 className="text-12 font-bold text-white-4">-5</h2>
            </div>
            <Image
              src={isPlaying ? "/icons/Pause.svg" : "/icons/Play.svg"}
              width={30}
              height={30}
              alt="play"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            />
            <div className="flex items-center gap-1.5">
              <h2 className="text-12 font-bold text-white-4">+5</h2>
              <Image
                src={"/icons/forward.svg"}
                width={24}
                height={24}
                alt="forward"
                onClick={forward}
                aria-label="Forward"
              />
            </div>
          </div>
          <div className="flex w-full justify-between items-center gap-2">
            <div className="min-w-[40px] text-right text-sm font-normal text-white-2 max-md:hidden">
              {formatTime(currentTime)}
            </div>
            <div className="flex w-full h-4 items-center">
              <Slider
                min={0}
                max={duration}
                onValueChange={(value) => handleProgressChange(value[0])}
                value={[currentTime]}
                aria-label="Progress"
              />
            </div>

            <div className="min-w-[40px] text-left text-sm font-normal text-white-2 max-md:hidden">
              {formatTime(duration)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex w-full items-center justify-center h-full gap-2">
            <Image
              src={isMuted ? "/icons/unmute.svg" : "/icons/mute.svg"}
              width={24}
              height={24}
              alt="mute unmute"
              onClick={toggleMute}
              className="md:block hidden cursor-pointer"
              aria-label="mute unmute"
            />
            <Slider
              min={0}
              max={100}
              onValueChange={(value) => handleVolumeChange(value[0])}
              value={[volume]}
              className="w-full md:min-w-[93px] hidden md:flex h-4"
              aria-label="Volume"
            />
          </div>
        </div>
        <Image
          src="/icons/close-circle.svg"
          width={24}
          height={24}
          className="absolute top-2 right-4 cursor-pointer"
          onClick={() => handlePlayerClose()}
          alt="close"
          aria-label="close"
        />
      </section>
    </div>
  );
};

export default PodcastPlayer;
