export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/icons/discover.svg",
    route: "/discover",
    label: "Discover",
  },
  {
    imgURL: "/icons/microphone.svg",
    route: "/create-podcast",
    label: "Create Podcast",
  },
  {
    imgURL: "/icons/profile.svg",
    route: "/profile",
    label: "Profile",
  },
  {
    imgURL: "/icons/chart.svg",
    route: "/plans",
    label: "Billing & Usage",
  }
];

export const voiceDetails = [
  {
    id: 1,
    name: "alloy",
  },
  {
    id: 2,
    name: "echo",
  },
  {
    id: 3,
    name: "fable",
  },
  {
    id: 4,
    name: "onyx",
  },
  {
    id: 5,
    name: "nova",
  },
  {
    id: 6,
    name: "shimmer",
  },
];

// This block maps over the pricingPlans array to generate pricing plan cards.
// Each card displays information based on whether the 'annual' state is true or false,
// which toggles between showing monthly and annual prices.
// Features and unavailable features are listed with icons indicating their availability.
export const pricingPlans = [
  {
    // Name of the pricing plan.
    name: "Free",
    // Monthly price of the plan as a string.
    monthlyPrice: "0",
    // Annual price of the plan as a string, representing cost per month when billed annually.
    annualPrice: "0",
    // A short description for your pricing table
    description:
      "This plan is ideal for individual users and hobbyists who are looking for essential functionalities to get started and explore the platform.",
    // Tailwind CSS classes for styling the card's background.
    cardBgClass: "bg-[#0003] backdrop-blur-3xl",
    // Tailwind CSS classes for styling the button within the card.
    buttonClass: "text-white-1 bg-[#ffffff1a] hover:bg-[#ffffff0d] ",
    // Array of features included in the plan.
    features: [
      "Create upto 5 Podcasts per month",
      "Unlimited Listening",
      "Text-to-speech",
      "Thumbnail upload",
      "1 AI voice model",
    ],
    // Array of features not available in the plan.
    unavailableFeatures: [
      "30 Podcasts per month",
      "AI Thumbnail generation",
      "AI voice model selection",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "15",
    annualPrice: "10",
    description:
      "If you're a small business or a startup, this plan is designed to cater to your needs. It offers a balance of essential features.",
    cardBgClass: "bg-[#00000080] backdrop-blur-3xl",
    buttonClass:
      "text-black-1 bg-[#ffffff] hover:bg-[#ffffff0d] hover:text-white-1 ",
    features: [
      "Create upto 30 Podcasts per month",
      "AI Thumbnail generation",
      "AI voice model selection",
      "Up to 6 AI voice models",
      "Unlimited Listening",
    ],
    unavailableFeatures: [
      "Unlimited Podcasts per month",
      "Unlimited AI Thumbnail generation",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: "55",
    annualPrice: "50",
    description:
      "Tailored for medium-sized businesses, this plan offers advanced tools and features to support your growing demands.",
    cardBgClass: "bg-[#0003] backdrop-blur-3xl",
    buttonClass: "text-white-1 bg-[#ffffff1a] hover:bg-[#ffffff0d] ",
    features: [
      "Unlimited Podcasts per month",
      "Unlimited AI Thumbnail generation",
      "AI voice model selection",
      "Podcast boost",
      "Gpt-3.5-turbo-16k model",
      "Podcast stats and analytics",
      "Unlimited Listening",
    ],
    // The third plan does not have any unavailable features, hence an empty array.
    unavailableFeatures: [],
  },
];