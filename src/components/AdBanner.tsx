// components/AdBanner.tsx
import Image from "next/image";
import Link from "next/link";

interface Ad {
  image: string;
  link: string;
  alt: string;
}

export default function AdBanner({ image, link, alt }: Ad) {
  return (
    <div className="w-full bg-yellow-400 p-4 shadow-md">
      <Link href={link} target="_blank" rel="noopener noreferrer">
        <Image src={image} alt={alt} width={1200} height={200} className="w-full h-auto rounded" />
      </Link>
    </div>
  );
}
