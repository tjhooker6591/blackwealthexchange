// components/Logo.tsx
import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image src="/favicon.png" alt="BWE Logo" width={40} height={40} />
      <span className="text-gold font-bold text-xl">Black Wealth Exchange</span>
    </Link>
  );
}
