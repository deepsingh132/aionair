import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useIsFetching } from "@/providers/IsFetchingProvider";
import { useEffect } from "react";

export function useGetPlan(id: string) {

  const { setIsFetching } = useIsFetching();

  const user = useQuery(api.users.getSubscriptionByClerkId, { clerkId: id });

  useEffect(() => {
    if (user === undefined) return;
    setIsFetching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return user;
}