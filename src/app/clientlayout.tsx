"use client";

import Header from "@/app/components/Header";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();


  const isLogin = pathname === "/";


  const hideChatFab = pathname === "/chatbot" || pathname?.startsWith("/chatbot/");

  return (
    <>
     
      {!isLogin && <Header />}

      {children}

    
      {!hideChatFab && !isLogin && (
        <Link
          href="/chatbot"
          className="fixed bottom-6 right-6 z-50 bg-white rounded-[28px] p-3 shadow-xl hover:scale-110 transition-transform"
          aria-label="Open Chatbot"
        >
          <Image src="/bot.png" alt="Chatbot" width={50} height={50} priority />
        </Link>
      )}
    </>
  );
}
