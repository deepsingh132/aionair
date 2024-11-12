"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative group flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative cursor-pointer h-4 w-full grow overflow-hidden rounded-full bg-black-5">
      <SliderPrimitive.Range className="SliderRange absolute h-full bg-white-1 group-hover:bg-[--accent-color]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="SliderThumb block invisible group-hover:visible  cursor-grabbing h-5 w-5 group-hover:bg-white-1 !ring-0 outline-none focus:outline-none focus:ring-0 rounded-full bg-white-1 transition-colors" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
