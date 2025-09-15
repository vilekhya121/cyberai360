"use client";
import SidebarChats from "../components/chatbot/SidebarChats"
import ChatBox from "../components/chatbot/ChatBot";
export default function ChatBotPage() {
  return (
    <div className="w-full">
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex h-[89vh]">
          <aside className="basis-1/4 shrink-0 ">
            <SidebarChats />
          </aside>
          <main className="basis-3/4 min-w-0">
            <ChatBox />
          </main>
        </div>
      </div>
    </div>
  );
}