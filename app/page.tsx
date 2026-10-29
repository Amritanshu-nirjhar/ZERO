import Hero from "@/components/Hero";
import Careers from "@/components/Careers";
import Projects from "@/components/Projects";
import Matching from "@/components/Matching";
import Pricing from "@/components/Pricing";
import BetaCTA from "@/components/BetaCTA";
import BottomBar from "@/components/BottomBar";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import SoundToggle from "@/components/SoundToggle";
import VelocityBand from "@/components/VelocityBand";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <VelocityBand />
        <Careers />
        <Projects />
        <Matching />
        <Pricing />
        <BetaCTA />
      </main>
      <Loader />
      <SoundToggle />
      <BottomBar />
      <Cursor />
    </>
  );
}
