"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useAudio } from "@/providers/AudioProvider";
import { PodcastProps, ProfileCardProps } from "@/types";

import LoaderSpinner from "./LoaderSpinner";
import { Button } from "./ui/button";
import { useIsSubscribed, useGetPlan } from "@/hooks/useIsSubscribed";

type planDetails = {
  subscriptionId: string;
  endsOn: number;
  plan: string;
};

const ProfileCard = ({
  podcastData,
  imageUrl,
  userFirstName,
  profileId,
}: ProfileCardProps) => {
  const { setAudio } = useAudio();

  const [randomPodcast, setRandomPodcast] = useState<PodcastProps | null>(null);

  const playRandomPodcast = () => {
    const randomIndex = Math.floor(Math.random() * podcastData.podcasts.length);

    setRandomPodcast(podcastData.podcasts[randomIndex]);
  };

  const isSubscribed = useIsSubscribed(profileId);
  const { plan } = useGetPlan(profileId) as planDetails;

  useEffect(() => {
    if (randomPodcast) {
      setAudio({
        title: randomPodcast.podcastTitle,
        audioUrl: randomPodcast.audioUrl || "",
        imageUrl: randomPodcast.imageUrl || "",
        author: randomPodcast.author,
        podcastId: randomPodcast._id,
      });
    }
  }, [randomPodcast, setAudio]);

  if (!imageUrl) return <LoaderSpinner />;

  return (
    <div className="mt-6 flex flex-col gap-6 max-md:items-center md:flex-row">
      <Image
        src={imageUrl}
        width={250}
        height={250}
        alt="Podcaster"
        className="aspect-square rounded-lg"
      />
      <div className="flex flex-col justify-center max-md:items-center">
        <div className="flex flex-col gap-2.5">
          <figure className="flex gap-2 max-md:justify-center">
            <Image
              src="/icons/verified.svg"
              width={24}
              height={24}
              alt="verified"
            />
            <h2 className="text-14 font-medium text-white-2">
              Verified Creator
            </h2>
          </figure>
          <div className="flex gap-4 items-center justify-stretch">
            <h1 className="text-32 font-extrabold mr-2 tracking-[-0.32px] text-white-1">
              {userFirstName}
            </h1>
            {isSubscribed && (
              <figure className="inline-flex gap-2 cursor-pointer max-md:justify-center">
                <Image
                  src="/icons/premium.svg"
                  width={24}
                  height={24}
                  alt="premium"
                />
                <h2 className="text-16 font-semibold text-white-2">{plan}</h2>
              </figure>
            )}
          </div>
        </div>

        <figure className="flex gap-3 py-6">
          <Image
            src="/icons/headphone.svg"
            width={24}
            height={24}
            alt="headphones"
          />
          <h2 className="text-16 font-semibold text-white-1">
            {podcastData?.listeners} &nbsp;
            <span className="font-normal text-white-2">monthly listeners</span>
          </h2>
        </figure>
        {podcastData?.podcasts.length > 0 && (
          <Button
            onClick={playRandomPodcast}
            className="text-16 bg-[--accent-color] font-extrabold text-white-1"
          >
            <Image
              src="/icons/Play.svg"
              width={20}
              height={20}
              alt="random play"
            />{" "}
            &nbsp; Play a random podcast
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
