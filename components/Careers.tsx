"use client";

import Note from "./Note";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import Heading from "./Heading";
import useReducedMotionSafe from "./useReducedMotionSafe";

const CAREERS = [
  [
    "Software Engineering",
    [
      "AI Applied Engineer",
      "Backend Engineer",
      "Full Stack Developer",
      "Frontend Developer",
    ],
  ],
  [
    "AI & Data Science",
    [
      "AI Engineer",
      "Machine Learning Engineer",
      "Data Scientist",
      "Business Intelligence Analyst",
    ],
  ],
  [
    "Business",
    [
      "Management Consultant",
      "Financial Analyst",
      "Operations Associate",
      "Chief of Staff",
    ],
  ],
  [
    "Product",
    [
      "Product Manager",
      "Product Analyst",
      "Product Marketer",
      "Product Engineer",
    ],
  ],
  [
    "Marketing",
    [
      "Marketing Analyst",
      "Growth Marketer",
      "Digital Marketing Specialist",
      "Content Marketer",
    ],
  ],
  [
    "Sales",
    [
      "Sales Development",
      "Account Executive",
      "Customer Success",
      "Business Development",
      "Solutions Consultant",
    ],
  ],
  [
    "Design",
    [
      "Product Designer",
      "User Experience Designer",
      "Design Engineer",
      "Systems Designer",
    ],
  ],
  [
    "Security",
    [
      "AI Security Analyst",
      "Security Engineer",
      "Cybersecurity Analyst",
      "SOC Analyst",
      "GRC Analyst",
    ],
  ],
] as const;

export default function Careers() {
  const reduce = useReducedMotionSafe();
  // Rows lean with scroll speed, like they have weight.
  const { scrollY } = useScroll();
  const v = useSpring(useVelocity(scrollY), { damping: 40, stiffness: 300 });
  const skewY = useTransform(v, [-2500, 2500], [3, -3]);
  return (
    <section className="px-5 py-32 md:py-48">
      <div className="relative mx-auto max-w-3xl text-center">
        <Heading
          text="Get hired into the world's most in-demand"
          swash="Careers"
          className="font-serif text-5xl leading-[1.02] tracking-[-0.03em] md:text-7xl"
        />
        <Note
          className="absolute -left-4 top-6 hidden md:-left-40 md:flex"
          flip
        >
          AI Native
        </Note>
      </div>

      <motion.ul
        style={reduce ? undefined : { skewY }}
        className="mx-auto mt-20 max-w-4xl"
      >
        {CAREERS.map(([category, roles], i) => (
          <motion.li
            key={category}
            initial={reduce ? false : { opacity: 0, x: i % 2 ? 80 : -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 16,
              delay: (i % 4) * 0.06,
            }}
          >
            <div className="group grid gap-2 border-b border-[--line] px-2 py-6 transition-colors duration-300 hover:bg-white md:grid-cols-2 md:items-center md:px-5">
              <h3 className="relative w-fit font-serif text-2xl tracking-[-0.02em] transition-transform duration-500 group-hover:translate-x-2 md:text-3xl">
                {category}
                <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-[--green] transition-transform duration-500 group-hover:scale-x-100" />
              </h3>
              <p className="text-sm leading-relaxed text-[--muted] md:text-[15px]">
                {roles.join(" · ")}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
