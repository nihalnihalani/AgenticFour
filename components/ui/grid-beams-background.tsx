"use client";

import React from "react";
import { GridBeams } from "./grid-beams";

export default function GridBeamsBackground() {
  return (
    <GridBeams
      gridSize={0}
      gridColor="rgba(255, 255, 255, 0.2)"
      rayCount={20}
      rayOpacity={0.55}
      raySpeed={1.5}
      rayLength="40vh"
      gridFadeStart={5}
      gridFadeEnd={90}
      backgroundColor="#0a0a0a"
      className="fixed inset-0 -z-10 w-full h-full"
    >
      <></>
    </GridBeams>
  );
}