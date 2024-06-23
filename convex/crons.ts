import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// reset the totalPodcasts count every month
crons.cron(
  "reset total podcasts count of all users every month",
  "0 0 1 * *", // every month
  internal.users.resetTotalPodcastsCron
);

export default crons;