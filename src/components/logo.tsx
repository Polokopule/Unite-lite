import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
       <Image
          src="https://storage.googleapis.com/stey-public/unite-logo.png"
          alt="Unite Logo"
          width={28}
          height={28}
          className="h-7 w-7"
        />
      <span className="text-xl font-headline font-bold">Unite</span>
    </Link>
  );
}
