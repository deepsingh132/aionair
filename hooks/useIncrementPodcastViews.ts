import { useState, useEffect } from "react";

type PodcastViewHookProps = {
  targetTime: number;
  isPlaying: boolean;
  duration: number;
};

const useIncrementPodcastViews = ({
  targetTime,
  isPlaying,
  duration,
}: PodcastViewHookProps): {
  isViewValid: boolean;
  setResetTimer: () => void;
} => {
  const [timePlayed, setTimePlayed] = useState(0); // Track total time the audio has been played

  useEffect(() => {
    if (!isPlaying || timePlayed >= targetTime) {
      return;
    }

    // Function to update timePlayed based on actual audio playback time (using an internal timer with setInterval)
    const updateTime = () => {
      setTimePlayed((prevTime) => {
        const newTime = prevTime + 0.1;
        // Case 1: Stop the timer once the audio has played for the targetTime
        if (newTime >= targetTime) {
          return targetTime; // Cap the time at targetTime (e.g., 10 seconds)
        }
        // Case 2: Stop the timer once the audio has ended (*2 to account for some inaccuracy)
        if (newTime * 2 >= duration) {
          return targetTime;
        }
        return newTime;
      });
    };

    // Start updating time when audio is playing
    const intervalId = setInterval(() => {
      updateTime();
    }, 100); // Update every 100ms NOTE: (Lower values may cause performance issues or inaccuracy)

    return () => {
      clearInterval(intervalId); // Clear the interval
    };
  }, [duration, isPlaying, targetTime, timePlayed]);

  if (timePlayed >= targetTime) {
    return { isViewValid: true, setResetTimer: () => setTimePlayed(0) };
  }
  return { isViewValid: false, setResetTimer: () => setTimePlayed(0) };
};

export default useIncrementPodcastViews;