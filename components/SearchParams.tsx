"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { useIsSubscribed } from "@/hooks/useIsSubscribed";
import { useClerk } from "@clerk/nextjs";
import { useIsFetching } from "@/providers/IsFetchingProvider";

export default function SearchParams({ setSuccess } : { setSuccess: (value: boolean) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useClerk();
  const isSubscribed = useIsSubscribed(user?.id ?? "");
  const isFetching = useIsFetching();

  // if the payment was successful, the user will be redirected to the plans page with a query parameter.
  // This block checks for the query parameter and displays a success message to the user.
  useEffect(() => {
    if (!isFetching && searchParams.get("session_id") && isSubscribed) {
      setSuccess(true);

      toast({
        title: "Payment successful ✅",
        variant: "success",
      });
    }
    // remove the query parameter from the URL and update the state after 5 seconds.
    setTimeout(() => {
      router.replace("/plans");
      setSuccess(false);
    }, 5000);
  }, [isFetching, isSubscribed, router, searchParams, setSuccess, toast]);

  return null;
}