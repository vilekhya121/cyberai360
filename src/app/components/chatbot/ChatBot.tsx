import { useState } from "react";
import ChatWelcome from "./ChatWelcome";
import SuggestedPrompts from "./SuggestedPrompts";
import ChatInput from "./ChatInput";

import BotAvatar from "../../../../public/chatbot/bot.svg";
import UserAvatar from "../../../../public/chatbot/user.svg";
import Image from "next/image";

export interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Message {
  id: number;
  text?: string;
  sender: "user" | "bot";
  attachments?: Attachment[];
}

type SendPayload =
  | string
  | {
      text?: string;
      attachments?: Attachment[];
    };

/* =========================
    API integration bits
   ========================= */
const CHAT_ENDPOINT =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/chatbot/query";


async function postToChatbot(
  query: string,
  timeoutMs = 90000
): Promise<{ ok: boolean; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // fallback to plain text if not JSON
    }

    let botText = "";
    const cleanText = (s: string) =>
      s.trim().replace(/^["'`]+|["'`]+$/g, "");

    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;
      if (typeof d.response === "string") {
        botText = cleanText(d.response);
      }
      if (!botText && typeof d.message === "string")
        botText = cleanText(d.message);
      if (!botText && typeof d.answer === "string")
        botText = cleanText(d.answer);
      if (!botText) botText = JSON.stringify(data, null, 2);
    } else if (typeof data === "string") {
      botText = cleanText(data);
    }

    return { ok: res.ok, text: botText || "No response text from server." };
  } catch (err) {
    const isAbort = (err as { name?: string })?.name === "AbortError";
    return {
      ok: false,
      text: isAbort
        ? "Request timed out."
        : err instanceof Error
        ? err.message
        : "Network error.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = async (payload: SendPayload) => {
    const normalized =
      typeof payload === "string" ? { text: payload } : payload;

    const newMessage: Message = {
      id: Date.now(),
      text: normalized.text?.trim() || undefined,
      attachments:
        normalized.attachments && normalized.attachments.length
          ? normalized.attachments
          : undefined,
      sender: "user",
    };

    if (!newMessage.text && !newMessage.attachments?.length) return;

    setMessages((prev) => [...prev, newMessage]);

    const userText =
      newMessage.text ||
      (newMessage.attachments?.length
        ? `Sent ${newMessage.attachments.length} file(s)`
        : "");

    const typingId = Date.now() + Math.floor(Math.random() * 1000);
    setMessages((prev) => [
      ...prev,
      { id: typingId, text: "…", sender: "bot" },
    ]);

    
    const result = await postToChatbot(userText || " ");

    setMessages((prev) =>
      prev.map((m) =>
        m.id === typingId
          ? {
              ...m,
              text: result.ok ? result.text : `Error: ${result.text}`,
            }
          : m
      )
    );
  };

  return (
    <div className="h-full bg-[#FFFFFF] w-full shadow-sm flex flex-col">
      {messages.length === 0 && (
        <div className="pt-16 pb-4 px-8">
          <ChatWelcome />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-full mx-auto w-full p-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start p-6 gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <Image
                    src={BotAvatar}
                    alt="Bot"
                    className="w-8 h-8 rounded-full object-cover mt-0.5 shadow-sm"
                  />
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 font-normal text-[14px]  
                    ${
                      isUser
                        ? "bg-[#F2F5FC] rounded-b-xl rounded-tl-xl text-black"
                        : "bg-[#F2F5FC] rounded-b-xl rounded-tr-xl text-black"
                    }`}
                >
                  {msg.text && (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                </div>
                {isUser && (
                  <Image
                    src={UserAvatar}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover mt-0.5 shadow-sm"
                  />
                )}
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="mt-2 px-4">
              <SuggestedPrompts onPromptClick={handleSendMessage} />
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pt-2 pb-5 bg-transparent">
        <div className="max-w-full mx-auto w-full">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
