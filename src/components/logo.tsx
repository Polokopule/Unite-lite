
import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
       <Image
          src="https://raw.githubusercontent.com/Polokopule/UM/c75512e1eb1db9a842359e7e8d145755832a5d62/20250929_192455.png"
          alt="Unite Logo"
          width={28}
          height={28}
          className="h-7 w-7"
        />
      <span className="text-xl font-headline font-bold">Unite</span>
    </Link>
  );
}
