import Image from "next/image";

export function Header() {
  return (
    <header className="border-border/50 relative z-1 flex shrink-0 items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 rounded-full bg-white px-2">
        <Image
          src="/ethmumbai.png"
          alt="App Logo"
          width={105}
          height={36}
          className="shrink-0"
        />
      </div>
    </header>
  );
}
