"use node";

import { v } from "convex/values";
import { ActionCtx, action, internalAction, internalMutation, mutation } from "./_generated/server";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";

type Metadata = {
  userId: string;
};

export const pay = action({
  args: { plan: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("You must be logged in to subscribe!");
    }

    if (!user.emailVerified) {
      throw new Error("You must have a verified email to subscribe!");
    }

    if (!args.plan) {
      throw new Error("You must provide a plan to subscribe to!");
    }

    const domain = process.env.HOSTING_URL ?? "http://localhost:3000";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-04-10",
    });

    let priceId = "";

    switch (args.plan) {
      case "Pro":
        priceId = process.env.PRICE_ID_PRO!;
        break;
      case "Enterprise":
        priceId = process.env.PRICE_ID_ENTERPRISE!;
        break;
      case "Pro-annual":
        priceId = process.env.PRICE_ID_PRO_ANNUAL!;
        break;
      case "Enterprise-annual":
        priceId = process.env.PRICE_ID_ENTERPRISE_ANNUAL!;
        break;
      default:
        throw new Error("Invalid plan provided!");
    }

    const paymentId = await ctx.runMutation(internal.payments.create);
    const session = await stripe.checkout.sessions.create({
      ui_mode: "hosted",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        userId: user.subject,
      },
      mode: "subscription",
      success_url: `${domain}/plans?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}`,
    });

    await ctx.runMutation(internal.payments.markPending, {
      paymentId,
      stripeId: session.id,
    });
    return session.url;
  },
});

export const cancelSubscription = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("You must be logged in to cancel your subscription!");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-04-10",
    });

    const { subscriptionId } = await ctx.runQuery(
      api.users.getSubscriptionByClerkId,
      {
        clerkId: user.subject,
      }
    );

    if (!subscriptionId) {
      throw new Error("No subscription found for this user!");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status === "canceled") {
      throw new Error("Subscription already canceled!");
    }

    await stripe.subscriptions.cancel(subscriptionId);

    await ctx.runMutation(internal.users.updateSubscription, {
      userId: user.subject,
      subscriptionId: undefined,
      endsOn: 0,
      plan: "Free",
    });

    return { success: true };
  },
});

export const createCustomerPortal = action({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("You must be logged in to access the customer portal!");
    }

    const { customerId } = await ctx.runQuery(
      api.users.getSubscriptionByClerkId,
      {
        clerkId: user.subject,
      }
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-04-10",
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url:
        process.env.HOSTING_URL ??
        `http://localhost:3000/plans?session_id={BILLING_PORTAL_SESSION_ID}`,
    });

    return session.url;
  },
});

async function getPlanNameFromProductId(productId: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
  });

  const product = await stripe.products.retrieve(productId);

  return product.name;
}

async function handleEvents(
  stripe: Stripe,
  ctx: ActionCtx,
  event: Stripe.Event
) {
  const completedEvent = event.data.object as Stripe.Checkout.Session & {
    metadata: Metadata;
  };

  const updateEvent = event.data.object as Stripe.Subscription & {
    metadata: Metadata;
  };

  let subscriptionId = completedEvent.subscription as string | undefined;
  let subscription = {} as Stripe.Subscription;

  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(
      completedEvent.subscription as string
    );
  }

  try {

    switch (event.type) {
      case "checkout.session.completed":
        const stripeId = (event.data.object as { id: string }).id;
        const userId = completedEvent.metadata.userId;
        const customerId = completedEvent.customer as string;

        await ctx.runMutation(internal.users.updateSubscription, {
          userId,
          subscriptionId: subscription.id,
          endsOn: subscription.current_period_end * 1000,
          plan: await getPlanNameFromProductId(
            subscription.items.data[0]?.price.product as string
          ),
          customerId: customerId,
        });
        await ctx.runMutation(internal.payments.fulfill, { stripeId, customerId, userId});
        break;

      case "invoice.payment_succeeded":
        await ctx.runMutation(internal.users.updateSubscriptionBySubId, {
          subscriptionId: subscription.items.data[0]?.price.id,
          endsOn: subscription.current_period_end * 1000,
          customerId: subscription.customer as string,
          plan: await getPlanNameFromProductId(
            subscription.items.data[0]?.price.product as string
          ),
        });
        break;

      case "customer.subscription.updated":
        await ctx.runMutation(internal.users.updateSubscriptionBySubId, {
          subscriptionId: updateEvent.id,
          endsOn: updateEvent.current_period_end * 1000, // the subscription ends on the current_period_end date regardless of the cancel_at date
          customerId: updateEvent.customer as string,
          plan: await getPlanNameFromProductId(
            updateEvent.items.data[0].price.product as string
          ),
        });
        // schedule a function to change the user's plan to "Free" after the cancel_at date
        if (updateEvent.cancel_at) {
          await ctx.scheduler.runAt(
            new Date(updateEvent.cancel_at * 1000),
            internal.users.updateSubscriptionBySubId,
            {
              subscriptionId: updateEvent.id,
              endsOn: 0,
              customerId: updateEvent.customer as string,
              plan: "Free",
            }
          );
        }
        /**
         * TODO: Add cancel scheduled task if the subscription is reactivated before the cancel_at date
         */
        break;
      case "customer.subscription.deleted":
        await ctx.runMutation(internal.users.updateSubscriptionBySubId, {
          subscriptionId: updateEvent.id,
          endsOn: updateEvent.current_period_end * 1000,
          customerId: completedEvent.customer as string,
        });
        break;

      /**
       * TODO: Add "customer.updated" event to update the user's (billing) email in the database
       */

      default:
        break;
    }
    return { success: true };
  } catch (error) {
    console.error("Error processing event: ", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export const fulfill = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-04-10",
    });

    const webhookSecret = process.env.STRIPE_WEBHOOKS_SECRET as string;

    try {
      const event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        webhookSecret
      );

      return await handleEvents(stripe, ctx, event);
    } catch (err) {
      console.error(err);
      return { success: false, error: (err as { message: string }).message };
    }
  },
});
