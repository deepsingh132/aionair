import { ActionCtx, action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

import OpenAI from "openai";
import { SpeechCreateParams } from "openai/resources/audio/speech.mjs";
import { getUser, getUserById, isUserSubscribed } from "./users";
import { useQuery } from "convex/react";
import { api, internal } from "./_generated/api";
import { rateLimit, checkRateLimit, resetRateLimit } from "@/lib/rateLimits";
import { UserIdentity } from "convex/server";

/**
 * TODO: Add caching to user openai actions and check if the latest prompt has already been generated before
 * if it has, return the same image or audio file
 */


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GENERATE_THUMBNAIL_ACTION = "generateThumbnailAction";
const GENERATE_AUDIO_ACTION = "generateAudioAction";


async function handleLimitations(ctx: ActionCtx, user: UserIdentity, voice: string | undefined) {
  if (!user) {
    throw new Error("User not authenticated");
  }

  // implement rate limiting
  const rateLimit = await ctx.runMutation(internal.openai.handleRateLimits, {
    userId: user.subject,
    type: voice ? GENERATE_AUDIO_ACTION : GENERATE_THUMBNAIL_ACTION,
  });

  await checkPodcastCount(ctx);

  // if no rate limit is returned, throw an error
  if (!rateLimit) {
    throw new Error("Rate limit exceeded, try again later");
  }

  if (!rateLimit.ok && rateLimit.retryAt) {
    // add some jitter to the retry time to avoid thundering herd problem
    const withJitter = rateLimit.retryAt + Math.random() * 10 * 1000;
    const retryAt = new Date(withJitter).toLocaleTimeString(
      // in IST timezone
      "en-US",
      { timeZone: "Asia/Kolkata" }
    );
    throw new Error("Rate limit exceeded, try after: " + retryAt + " (IST)");
  }

  // get user subscription
  const { isSubscribed } = await ctx.runQuery(
    internal.openai.getUserSubscription,
    {}
  );

  // only allow users with a plan to generate thumbnails
  if (!voice && !isSubscribed) {
    throw new Error("User must have a subscription to generate thumbnails");
  }

  // only allow users with a plan to use other voice options than the default
  if (voice && !isSubscribed && voice !== "alloy") {
    throw new Error("User must have a subscription to use other voice options");
  } else {
    return isSubscribed;
  }
}

export const generateAudioAction = action({
  args: { input: v.string(), voice: v.string() },
  handler: async (ctx, { voice, input }) => {

    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const defaultVoice = "alloy" as SpeechCreateParams["voice"];

    const isSubscribed = await handleLimitations(ctx, user, voice);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: isSubscribed? voice as SpeechCreateParams["voice"] : defaultVoice,
      input,
    });

    const buffer = await mp3.arrayBuffer();

    return buffer;
  },
});


export const handleRateLimits = internalMutation({
  args: { userId: v.string(), type: v.string() },
  handler: async (ctx, args) => {

    switch (args.type) {
      case GENERATE_AUDIO_ACTION:
        return await rateLimit(ctx, {
         name: args.type,
         key: args.userId,
         throws: false,
        });

      case GENERATE_THUMBNAIL_ACTION:
        return await rateLimit(ctx, {
          name: args.type,
          key: args.userId,
          throws: false,
        });
      default:
        return;
    }
  },
});


async function checkPodcastCount(ctx: ActionCtx) {

  const user = await ctx.runQuery(api.users.getUser);

  if (!user) {
    throw new Error("User not found");
  }

  switch (user.plan?.toLowerCase()) {
    case "free":
      // check if user has generated more than 5 podcasts
      if (user.totalPodcasts >= 5) {
        throw new Error("Free users can only generate 5 podcasts per month");
      }
      return;
    case "pro":
      // check if user has generated more than 30 podcasts
      if (user.totalPodcasts >= 30) {
        throw new Error("Pro users can only generate 30 podcasts per month");
      }
      return;
    case "enterprise":
      // check if user has generated more than 100 podcasts
      if (user.totalPodcasts >= 100) {
        throw new Error("Enterprise users can only generate 100 podcasts per month");
      }
      return;
    default:
      // check if user has generated more than 5 podcasts
      if (user.totalPodcasts >= 5) {
        throw new Error("Free users can only generate 5 podcasts per month");
      }
      return;
  }
}

// function to get user subscription details
export const getUserSubscription = internalQuery({
  args: {},
  handler: async (ctx) => {

    const identity = await ctx.auth.getUserIdentity();

    const user = await getUserById(ctx, { clerkId: identity?.subject! });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      isSubscribed: await isUserSubscribed(ctx),
      plan: user.plan,
    };
  },
});

export const generateThumbnailAction = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("User not authenticated");
    }

    await handleLimitations(ctx, user, undefined);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const url = response.data[0].url;

    if (!url) {
      throw new Error("Error generating thumbnail");
    }

    const imageResponse = await fetch(url);
    const buffer = await imageResponse.arrayBuffer();
    return buffer;
  },
});
