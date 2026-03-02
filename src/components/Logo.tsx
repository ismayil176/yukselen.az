import Image from "next/image";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo.jpg"
        alt="Logo"
        width={size}
        height={size}
        className="rounded-xl shadow-sm"
        priority
      />
    </div>
  );
}
