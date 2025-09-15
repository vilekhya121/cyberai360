import { useState } from "react";
import NewChartIcon from "../../../../public/chatbot/New Chat.svg";
import HistoryIcon from "../../../../public/chatbot/timer.svg";
import AlertIcon from "../../../../public/chatbot/bookmark.svg";
import MessageIcon from "../../../../public/chatbot/message1.svg";
import Image from "next/image";

const recentChats = [
  {
    title: "CVE Impact Lookup",
    preview: "about vulnerabilities affecting Zone...",
    time: "2 hrs ago",
  },
  {
    title: "Login Anomaly Report",
    preview: "checked failed login attempts over t...",
    time: "2 hrs ago",
  },
  {
    title: "Compliance Overview",
    preview: "requested patching and AV stats. Ple...",
    time: "2 hrs ago",
  },
  {
    title: "File Integrity Alerts",
    preview: "asked for file hash violations. 3 files c...",
    time: "2 hrs ago",
  },
  {
    title: "Role-Based Access Summ...",
    preview: "inquired about admin Panel access...",
    time: "2 hrs ago",
  },
];

export default function SidebarChats() {
  const [activeButton, setActiveButton] = useState("New Chat");

  return (
    <div className="bg-[#F3F7FF] p-6 w-full flex flex-col h-full">
      {/* Top menu */}
      <div className="flex flex-col gap-2 text-sm font-medium">
      <div className="font-bold text-2xl mb-3">Insight AI</div>
        <button
          onClick={() => setActiveButton("New Chat")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            activeButton === "New Chat"
              ? "bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] shadow-sm text-[#204496] font-semibold"
              : "hover:bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] text-slate-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              activeButton === "New Chat"
                ? "bg-[#204496]"
                : "bg-white group-hover:bg-[#204496]"
            }`}
          >
            <Image
              src={NewChartIcon}
              alt=""
              className={`w-[18px] h-[18px] transition-colors ${
                activeButton === "New Chat"
                  ? "filter invert brightness-0" 
                  : "text-[#204496]" 
              } group-hover:invert group-hover:brightness-0`}
            />
          </div>
          New Chat
        </button>

        <button
          onClick={() => setActiveButton("History")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            activeButton === "History"
              ? "bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] shadow-sm text-[#204496] font-semibold"
              : "hover:bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] text-slate-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              activeButton === "History"
                ? "bg-[#204496]"
                : "bg-white group-hover:bg-[#204496]"
            }`}
          >
            <Image
              src={HistoryIcon}
              alt=""
              className={`w-[18px] h-[18px] transition-colors ${
                activeButton === "History"
                  ? "filter invert brightness-0"
                  : "text-blue-500 group-hover:invert group-hover:brightness-0"
              }`}
            />
          </div>
          History
        </button>

        <button
          onClick={() => setActiveButton("Saved")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            activeButton === "Saved"
              ? "bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] shadow-sm text-[#204496] font-semibold"
              : "hover:bg-[linear-gradient(180deg,#DDE8FF_0%,#F3F7FF_100%)] text-slate-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              activeButton === "Saved"
                ? "bg-[#204496]"
                : "bg-white group-hover:bg-[#204496]"
            }`}
          >
            <Image
              src={AlertIcon}
              alt=""
              className={`w-[18px] h-[18px] transition-colors ${
                activeButton === "Saved"
                  ? "filter invert brightness-0"
                  : "text-blue-500 group-hover:invert group-hover:brightness-0"
              }`}
            />
          </div>
          Saved
        </button>
      </div>

      {/* Recent chats */}
      <div className="flex-1 overflow-y-auto mt-6">
        <div className="text-[16px] font-semibold text-slate-500 mb-3 px-1">
          Recent Chats
        </div>

        <div className="flex flex-col gap-2">
          {recentChats.map((chat, i) => (
            <button
              key={i}
              className="group text-left bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:bg-slate-50 transition-colors"
            >
              {/* Row 1: icon + title (left) | time (right) */}
              <div className="flex items-start gap-2">
                <Image
                  src={MessageIcon}
                  alt=""
                  className="mt-0.5 w-[18px] h-[18px] flex-shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {chat.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex-shrink-0 leading-5">
                      {chat.time}
                    </div>
                  </div>

                  {/* Row 2: preview */}
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {chat.preview}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}