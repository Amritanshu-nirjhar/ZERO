"use client";

import { useEffect, useState } from "react";
import Magnetic from "./Magnetic";

// Floating "Join Beta" pill; tucks away once the beta section is on screen.
export default function BottomBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const beta = document.getElementById("beta");
    if (!beta) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(beta);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#cfcdc7]/70 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-500 ${
        hidden ? "pointer-events-none translate-y-24 opacity-0" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="h-11 w-11 rounded-full bg-[radial-gradient(circle_at_35%_30%,#e2fde6_0%,#6fd394_38%,#1f6e45_80%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.7)]"
      />
      <Magnetic strength={0.2}>
        <a
          href="#beta"
          tabIndex={hidden ? -1 : 0}
          className="whitespace-nowrap rounded-full bg-[#1f1e1d] px-14 py-3 text-sm font-medium text-white transition-colors hover:bg-black md:px-28"
        >
          Join Beta
        </a>
      </Magnetic>
    </div>
  );
}
