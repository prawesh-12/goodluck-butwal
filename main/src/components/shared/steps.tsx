export function TabShoulders({ width }: { width: number }) {
  return (
    <>
      <div aria-hidden className="absolute -inset-x-[39px] bottom-0 z-[1] h-px bg-white" />
      <div aria-hidden className="absolute -left-[39px] top-0 z-[2] h-full w-10 rounded-br-[20px] border-b border-r border-hairline" />
      <div aria-hidden className="absolute -right-[39px] top-0 z-[2] h-full w-10 rounded-bl-[20px] border-b border-l border-hairline" />
      <div aria-hidden className="absolute -inset-x-[2px] -bottom-3 top-0 z-[2] bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0)_100%)]" style={{ width: width + 4 }} />
    </>
  );
}
