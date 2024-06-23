"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import Image from "next/image";
import { useGetPlan, useIsSubscribed } from "@/hooks/useIsSubscribed";
import { useClerk } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import {
  Activity,
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
} from "lucide-react";
import PodcastPlayer from "@/components/PodcastPlayer";
import { useIsFetching } from "@/providers/IsFetchingProvider";
import LoaderSpinner from "@/components/LoaderSpinner";
import { pricingPlans } from "@/constants";
import ButtonSpinner from "@/components/ButtonSpinner";
import { Suspense } from "react";
import SearchParams from "@/components/SearchParams";

type planDetails = {
  subscriptionId: string | null;
  plan: string | null;
  endsOn: number | null;
};

export default function Payments() {
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const { user } = useClerk();
  const { toast } = useToast();
  const { isFetching } = useIsFetching();

  const isSubscribed = useIsSubscribed(user?.id ?? "");
  const planDetails = useGetPlan(user?.id ?? "") as planDetails;

  const totalPodcasts = useQuery(api.users.getTotalPodcastsOfUser, {
    clerkId: user?.id ?? "",
  });

  const pay = useAction(api.stripe.pay);
  const cancel = useAction(api.stripe.cancelSubscription);
  const manage = useAction(api.stripe.createCustomerPortal);

  /**
   * TODO: Get the remaining podcasts based on the plan of the user from the database instead of hardcoding it.
   */

  const podcastsRemaining =
    planDetails.plan === "Enterprise"
      ? "unlimited"
      : ((30 - totalPodcasts!) as number);

  const handleUpgrade = async (plan: string) => {
    setSelectedPlan(plan);
    setIsLoaded(true);
    if (plan === "Free") {
      router.push("/");
      return;
    }

    if (annual) {
      plan = plan + "-annual";
    }

    try {
      const paymentUrl = await pay({ plan });
      router.push(paymentUrl!);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing your payment",
        variant: "destructive",
      });
      setIsLoaded(false);
      setSelectedPlan("");
    }
    setIsLoaded(false);
    setSelectedPlan("");
  };

  const handleCancellation = async () => {
    setSelectedPlan("cancel");
    setIsLoaded(true);

    const confirm = window.confirm(
      "Are you sure you want to cancel your subscription?"
    );

    if (!confirm) {
      setSelectedPlan("");
      setIsLoaded(false);
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to cancel your subscription",
        variant: "destructive",
      });
      setSelectedPlan("");
      setIsLoaded(false);
      return;
    }

    if (planDetails.plan === "Free") {
      toast({
        title: "Error",
        description: "You cannot cancel a free subscription",
        variant: "destructive",
      });

      setSelectedPlan("");
      setIsLoaded(false);
      return;
    }

    try {
      const cancelPlan = await cancel({ clerkId: user.id });

      if (cancelPlan.success) {
        toast({
          title: "Success",
          description: "Your subscription has been cancelled",
          variant: "success",
        });

        setSelectedPlan("");
        setIsLoaded(false);
        router.replace("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while cancelling your subscription, please try again later.",
        variant: "destructive",
      });
      setSelectedPlan("");
      setIsLoaded(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setSelectedPlan("manage");
      setIsLoaded(true);
      const portalUrl = await manage();
      router.push(portalUrl!);
      setIsLoaded(false);
      setSelectedPlan("");
    } catch (error) {
      setSelectedPlan("");
      setIsLoaded(false);
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
    }
  };

  function SuspenseFallback() {
    return (
      <div className="fixed top-0 left-0 z-50 w-full h-full bg-[--primary-color] flex items-center justify-center">
        <LoaderSpinner />
      </div>
    );
  }

  if (!isFetching && success) {
    return (
      <main className="flex relative flex-col w-full items-center justify-center min-h-screen bg-zinc-950">
        <Image
          width={1920}
          height={1080}
          className="absolute w-screen h-full min-h-screen object-cover z-0"
          src="/images/blueBlob.svg"
          alt="alt text"
        />
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h1 className="text-4xl font-bold text-white-1 z-50 text-center">
            Thank you for subscribing!
          </h1>
          <p className=" text-gray-300 mt-4 z-30 text-center">
            You are now subscribed to the {planDetails.plan} plan.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Suspense fallback={<SuspenseFallback />}>
          <SearchParams setSuccess={setSuccess} />
      </Suspense>
      {isFetching && !isSubscribed ? (
        <div className="fixed top-0 left-0 z-50 w-full h-full bg-[--primary-color] flex items-center justify-center">
          <LoaderSpinner />
        </div>
      ) : isSubscribed ? (
        <div className="flex relative flex-col">
          <div className="flex relative w-full min-h-screen">
            <LeftSidebar />
            <div className="flex flex-col flex-1 bg-[--primary-color] rounded-lg p-[24px] w-full">
              <div className="flex h-16 items-center justify-between md:hidden">
                <Image
                  src="/icons/miclogo.svg"
                  width={30}
                  height={30}
                  alt="menu icon"
                />
                <MobileNav />
              </div>

              <h1 className="text-4xl font-bold text-white-1 text-center">
                Your current plan
              </h1>
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-semibold text-white-1">
                    Plan details
                  </h2>
                  <div className="flex flex-col w-full mx-auto">
                    <p className="flex relative justify-between items-center text-base text-slate-300">
                      <div className="flex items-center self-start gap-2">
                        Your current plan is the {planDetails.plan} plan{" "}
                        {
                          // display billed annually if the planDetails.endsOn date is greater than 30 days from now
                          planDetails.endsOn! >
                          Date.now() + 30 * 24 * 60 * 60 * 1000 ? (
                            <span className="inline-flex me-2 items-center text-xs text-gray-300 bg-gray-700  rounded-full py-0.5 px-2.5">
                              Billed annually
                            </span>
                          ) : null
                        }
                      </div>
                      {
                        <div className="flex gap-4">
                          <Button
                            onClick={() => handleManageSubscription()}
                            title="Manage"
                            className="w-[fit-content] hover:brightness-[.85] bg-[--accent-color] text-white-1"
                          >
                            {isLoaded && selectedPlan === "manage" ? (
                              <ButtonSpinner />
                            ) : null}
                            Manage
                          </Button>

                          <Button
                            onClick={() => handleCancellation()}
                            title="Cancel"
                            className="w-[fit-content] hover:brightness-[.85] bg-red-500 text-white-1"
                          >
                            {isLoaded && selectedPlan === "cancel" ? (
                              <ButtonSpinner />
                            ) : null}
                            Cancel
                          </Button>
                        </div>
                      }
                    </p>

                    <p className="text-base text-slate-300">
                      Your subscription ends on{" "}
                      {new Date(planDetails.endsOn!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-semibold text-white-1">Usage</h2>
                  <div className="flex flex-col gap-2">
                    <p className="text-base text-slate-300">
                      <Activity
                        size={24}
                        className="inline-flex mr-2 text-white-1"
                      />
                      You have created {totalPodcasts} podcasts this month.
                    </p>
                    <p className="flex items-center text-base text-slate-300">
                      {podcastsRemaining === "unlimited" ||
                      podcastsRemaining - totalPodcasts! == 30 ? (
                        <BatteryFull
                          size={24}
                          className="inline-flex mr-2 text-white-1"
                          style={{ transform: "rotate(270deg)" }}
                        />
                      ) : podcastsRemaining > 10 ? (
                        <BatteryMedium
                          size={24}
                          className="inline-flex mr-2 text-white-1"
                          style={{ transform: "rotate(270deg)" }}
                        />
                      ) : podcastsRemaining <= 10 && podcastsRemaining > 0 ? (
                        <BatteryLow
                          size={24}
                          className="inline-flex mr-2 text-white-1"
                          style={{ transform: "rotate(270deg)" }}
                        />
                      ) : podcastsRemaining === 0 ? (
                        <Battery
                          size={24}
                          className="inline-flex mr-2 text-white-1"
                          style={{ transform: "rotate(270deg)" }}
                        />
                      ) : null}
                      You have {podcastsRemaining} podcasts remaining for the
                      month of{" "}
                      {new Date().toLocaleString("default", { month: "long" })}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <RightSidebar />
          </div>
          <PodcastPlayer />
        </div>
      ) : (
        <main className="flex relative flex-col w-full items-center justify-center min-h-screen bg-zinc-950">
          <Image
            width={1920}
            height={1080}
            className="absolute w-screen h-full min-h-screen object-cover z-0"
            src="/images/blueBlob.svg"
            alt="alt text"
          />

          <div className="relative items-center px-8 py-6 mx-auto md:px-12 max-w-7xl">
            <h1 className="text-4xl font-bold text-white-1 z-50 text-center">
              Choose a plan that works for you
            </h1>

            <div className="md:max-w-sm mx-auto">
              <div className="inline-flex w-full border rounded-full my-6 overflow-hidden border-[#fff3] p-0.5 z-0">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={` ${annual ? "" : "bg-[#00000080]"} font-medium rounded-full transition h-12 w-full py-2 block px-8 text-xs text-white-1`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={` ${annual ? "bg-[#00000080]" : ""} font-medium rounded-full transition h-12 w-full py-2 block px-8 text-xs border-white text-white-1`}
                  type="button"
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-12 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col justify-between p-8 shadow-2xl  rounded-3xl ${plan.cardBgClass} backdrop-blur-3xl shadow-gray-900/50`}
                >
                  <div>
                    <div className="flex flex-col justify-between gap-3">
                      <p className="text-xl font-medium tracking-tight text-white-1">
                        {plan.name}
                      </p>
                      <p className="text-white-1">
                        <span className="text-2xl tracking-tight">
                          <span>
                            ${annual ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                        </span>
                        <span className="text-base font-medium">
                          /m
                          <span>
                            {annual &&
                              plan.annualPrice !== "0" &&
                              " (billed annually)"}
                          </span>
                        </span>
                      </p>
                    </div>
                    <p className="mt-8 text-xs text-[#fffc]">
                      {plan.description}
                    </p>
                    <ul className="flex flex-col order-last mt-8 text-sm text-white gap-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="inline-flex text-white-1 items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon icon-tabler icon-tabler-circle-check"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                            <path d="M9 12l2 2l4 -4" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {plan.unavailableFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="inline-flex text-white-1 items-center gap-2 opacity-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon icon-tabler icon-tabler-circle-x"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                            <path d="M10 10l4 4m0 -4l-4 4" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex mt-6">
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      title={plan.name}
                      aria-label="get started"
                      className={`flex items-center justify-center w-full  h-12 px-4 py-2 text-base font-medium transition-all duration-200 rounded-xl ${plan.buttonClass}`}
                    >
                      {isLoaded && plan.name === selectedPlan ? (
                        <ButtonSpinner />
                      ) : (
                        "Get started"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </>
  );
}
