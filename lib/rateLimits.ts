import { defineRateLimits } from "convex-helpers/server/rateLimit";

const SECOND = 1000; // ms
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const { checkRateLimit, rateLimit, resetRateLimit } = defineRateLimits({
  // A per-user limit, allowing one every ~6 seconds.
  // Allows up to 3 in quick succession if they haven't sent many recently.
  generateAudioAction: { kind: "fixed window", rate: 3, period: MINUTE*2 },
  generateThumbnailAction: { kind: "fixed window", rate: 3, period: MINUTE*2 },
  createPodcast: { kind: "fixed window", rate: 3, period: MINUTE*2 },
  uploadFile: { kind: "fixed window", rate: 3, period: MINUTE*2 },

});
