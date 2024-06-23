import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useIsFetching } from "@/providers/IsFetchingProvider";
import { useEffect } from "react";

export function useIsSubscribed(id: string) {

  const { setIsFetching } = useIsFetching();

  const user = useQuery(api.users.getSubscriptionByClerkId, { clerkId: id });

  useEffect(() => {
    if (!user) return;
    setIsFetching(false);
  }, [user]);

  if (!user || !user.endsOn) return false;

  return user?.endsOn > Date.now();
}

export function useGetPlan(id: string) {

  const { setIsFetching } = useIsFetching();

  const user = useQuery(api.users.getSubscriptionByClerkId, { clerkId: id });

  useEffect(() => {
    if (!user) return;
    setIsFetching(false);
  }, [user]);

  if (!user || !user.plan) return "free";

  return user;
}