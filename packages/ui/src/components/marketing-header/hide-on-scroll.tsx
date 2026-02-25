"use client";

import { Slide, useScrollTrigger } from "@mui/material";

type HideOnScrollProps = {
  children: React.ReactElement;
};

export const HideOnScroll = ({ children }: HideOnScrollProps) => {
  const trigger = useScrollTrigger({
    threshold: 100,
  });

  return (
    <Slide appear direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};
