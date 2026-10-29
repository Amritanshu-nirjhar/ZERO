// A word whose first letter is a flourished script capital, e.g. the "C" in "Careers".
export default function Swash({
  children,
  className = "text-[--green]",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span className="relative mr-[-0.08em] inline-block translate-y-[0.06em] font-script text-[1.3em] leading-[0]">
        {children[0]}
      </span>
      {children.slice(1)}
    </span>
  );
}
