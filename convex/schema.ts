import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { rateLimitTables } from "convex-helpers/server/rateLimit";

export default defineSchema({
  ...rateLimitTables,
  podcasts: defineTable({
    user: v.id("users"),
    podcastTitle: v.string(),
    podcastDescription: v.string(),
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    author: v.string(),
    authorId: v.string(),
    authorImageUrl: v.string(),
    voicePrompt: v.string(),
    imagePrompt: v.string(),
    voiceType: v.string(),
    audioDuration: v.number(),
    views: v.number(),
  })
    .searchIndex("search_author", { searchField: "author" })
    .searchIndex("search_title", { searchField: "podcastTitle" })
    .searchIndex("search_body", { searchField: "podcastDescription" }),
  users: defineTable({
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    name: v.string(),
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    endsOn: v.optional(v.number()),
    plan: v.optional(v.string()),
    totalPodcasts: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_subscriptionId", ["subscriptionId"]),
  payments: defineTable({
    stripeId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    userId: v.optional(v.string()),

  }).index("stripeId", ["stripeId"]),
});