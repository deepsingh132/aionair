import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const create = internalMutation({
  handler: async (ctx) => {
    return await ctx.db.insert("payments", {});
  },
});

export const markPending = internalMutation({
  args: { paymentId: v.id("payments"), stripeId: v.string() },
  handler: async (ctx, { paymentId, stripeId }) => {
    await ctx.db.patch(paymentId, { stripeId });
  },
});

export const fulfill = internalMutation({
  args: {
    stripeId: v.string(),
    customerId: v.string(),
    userId: v.string(),
   },
  handler: async (ctx, { stripeId, customerId, userId }) => {
    const { _id: paymentId } = (await ctx.db
      .query("payments")
      .withIndex("stripeId", (q) => q.eq("stripeId", stripeId))
      .unique())!;
    await ctx.db.patch(paymentId, {stripeId, customerId, userId});
  },
});
