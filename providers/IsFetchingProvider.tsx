"use client";

import { useContext, createContext, useState, useEffect } from "react";
import { IsFetchingContextType } from "@/types";

// create a context for the isFetching state and a function to update it when the isSubscribed hook is called
const IsFetchingContext = createContext<IsFetchingContextType | undefined>(undefined);

// create a provider to wrap the app in that will provide the isFetching state and the function to update it
const IsFetchingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isFetching, setIsFetching] = useState<boolean>(true);

  return (
    <IsFetchingContext.Provider value={{ isFetching, setIsFetching }}>
      {children}
    </IsFetchingContext.Provider>
  );
};

// create a hook to use the isFetching state and the function to update it
export const useIsFetching = () => {
  const context = useContext(IsFetchingContext);

  if (!context) {
    throw new Error("useIsFetching must be used within an IsFetchingProvider");
  }

  return context;
};

export default IsFetchingProvider;