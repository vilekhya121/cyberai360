"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavLink = {
  label: string;
  link: string;
  imageUrl?: string;
};

const navLinks: NavLink[] = [
  { label: "Overview", link: "/overview", imageUrl: "/ops/icons/overview.png" },
  { label: "Database", link: "/db", imageUrl: "/ops/icons/db-v.png" },
  { label: "VM", link: "/vm-home", imageUrl: "/ops/icons/vm.png" },
  { label: "ChatBot", link: "/chatbot", imageUrl: "/ops/icons/chatbot.png" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  function handleLogout() {
    // Clear stored user data
    localStorage.removeItem("mathops_user");
    sessionStorage.removeItem("mathops_user");
    // Redirect to login
    router.push("/");
  }

  return (
    <nav className="bg-white shadow text-gray-900">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsOpen(!isOpen)}
            >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Image src="/ops/logo.svg" alt="Logo" width={140} height={180} />
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:block sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <div className="flex space-x-6">
              {navLinks.map((item) => {
                const active = pathname === item.link;
                return (
                  <div key={item.link} className="flex flex-col items-center">
                    <div className="flex items-center">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={16}
                          height={16}
                          className="mr-1"
                        />
                      ) : null}
                      <Link
                        href={item.link}
                        className={`pl-1 pr-3 py-2 text-md items-center font-medium transition-colors ${
                          active
                            ? "font-bold text-blue-600"
                            : "text-gray-800 hover:text-blue-600"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </div>
                    {active ? (
                      <Image
                        src="/ops/icons/border.png"
                        alt=""
                        width={100}
                        height={12}
                      />
                    ) : (
                      <span className="h-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile + Logout */}
          <div className="absolute inset-y-0 right-0 hidden items-center sm:flex gap-4">
            <Image
              src="/ops/icons/profile.png"
              alt="User"
              width={36}
              height={36}
              className="rounded-full"
            />
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="sm:hidden border-t">
          <div className="space-y-1 px-2 py-3">
            {navLinks.map((item) => {
              const active = pathname === item.link;
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
