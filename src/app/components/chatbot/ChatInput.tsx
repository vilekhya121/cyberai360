import React, { useEffect, useMemo, useRef, useState } from "react";
import SendIcon from  "../../../../public/chatbot/send1.svg";
import AttachIcon from  "../../../../public/chatbot/attachment.svg";
import AudioIcon from  "../../../../public/chatbot/audio.svg";
import type { Attachment } from "./ChatBot"; 
import Image from "next/image";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  onstart: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type SendPayload =
  | string
  | {
      text?: string;
      attachments?: Attachment[];
    };

export default function ChatInput({
  onSendMessage,
}: {
  onSendMessage: (message: SendPayload) => void;
}) {
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const maxChars = 2500;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- Speech Recognition ----
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepAliveRef = useRef(false);
  const baseMessageRef = useRef("");
  const interimRef = useRef("");

  const SpeechRecognitionImpl = useMemo(() => {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  useEffect(() => {
    if (!SpeechRecognitionImpl) return;

    const sr: SpeechRecognition = new SpeechRecognitionImpl();
    sr.lang = "en-IN";
    sr.continuous = true;
    sr.interimResults = true;
   
    sr.maxAlternatives = 1;

    sr.onstart = () => {
      setIsRecording(true);
    };

    sr.onresult = (e: SpeechRecognitionEvent) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) {
          baseMessageRef.current = (baseMessageRef.current + (baseMessageRef.current ? " " : "") + txt).trim();
          interimRef.current = "";
        } else {
          live += txt;
        }
      }
      const composed = (baseMessageRef.current + (live ? " " + live : "")).slice(0, maxChars);
      setMessage(composed);
      setCharCount(composed.length);
    };

    sr.onerror = () => {
      if (keepAliveRef.current) {
        try {
          sr.stop();
        } catch {}
        setTimeout(() => {
          if (keepAliveRef.current) {
            try { sr.start(); } catch {}
          }
        }, 200);
      } else {
        setIsRecording(false);
      }
    };

    sr.onend = () => {
      if (keepAliveRef.current) {
        setTimeout(() => {
          if (keepAliveRef.current) {
            try { sr.start(); } catch {}
          }
        }, 200);
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = sr;

    return () => {
      try { sr.abort(); } catch {}
    };
  }, [SpeechRecognitionImpl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, maxChars);
    setMessage(value);
    setCharCount(value.length);
    if (isRecording) baseMessageRef.current = value;
  };

  const handleSend = () => {
    const trimmed = message.trim();
    const attachments: Attachment[] =
      files.length > 0
        ? files.map((f) => ({
            name: f.name,
            url: URL.createObjectURL(f),
            mimeType: f.type || "application/octet-stream",
            size: f.size,
          }))
        : [];

    if (!trimmed && attachments.length === 0) return;

    onSendMessage({
      text: trimmed || undefined,
      attachments: attachments.length ? attachments : undefined,
    });

    setMessage("");
    setCharCount(0);
    setFiles([]);
    if (isRecording) {
      baseMessageRef.current = "";
      interimRef.current = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || !list.length) return;
    const newFiles = Array.from(list);
    setFiles((prev) => [...prev, ...newFiles]);
    e.currentTarget.value = "";
  };

  const removeFileAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleRecording = () => {
    if (!SpeechRecognitionImpl) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      keepAliveRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setIsRecording(false);
    } else {
      keepAliveRef.current = true;
      baseMessageRef.current = message;
      interimRef.current = "";
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
        keepAliveRef.current = false;
      }
    }
  };

  const isImage = (f: File) => f.type.startsWith("image/");

  return (
    <div className="mt-auto">
      <div className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="relative px-5 py-3">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) =>
                isImage(f) ? (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200"
                    title={`${f.name} · ${(f.size / 1024).toFixed(1)} KB`}
                  >
                    <Image
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFileAt(i)}
                      type="button"
                      className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs rounded-full w-5 h-5"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-300 bg-slate-50"
                    title={`${f.name} · ${(f.size / 1024).toFixed(1)} KB`}
                  >
                    <span className="truncate max-w-[160px]">{f.name}</span>
                    <button
                      onClick={() => removeFileAt(i)}
                      type="button"
                      className="ml-1 text-slate-500 hover:text-slate-700"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask Something..."
            className="w-full pr-12 text-sm placeholder:text-slate-400 focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim() && files.length === 0}
            title="Send"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image src={SendIcon} alt="" aria-hidden="true" className="w-[16px] h-[16px]" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-[#EEF3FF] px-4 py-2">
          <div className="flex items-center gap-3 text-[#204496]">
            <input
            title="file"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFilesPicked}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />

            <button
              type="button"
              aria-label="Attach file"
              title="Attach file(s)"
              className="p-1 cursor-pointer"
              onClick={openFilePicker}
            >
              <Image src={AttachIcon} alt="" aria-hidden="true" className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              aria-label="Voice"
              title={SpeechRecognitionImpl ? (isRecording ? "Stop" : "Start voice input") : "Voice unavailable"}
              className="p-1 cursor-pointer"
              onClick={toggleRecording}
            >
              <Image
                src={AudioIcon}
                alt=""
                aria-hidden="true"
                className={`w-[18px] h-[18px] ${isRecording ? "animate-pulse" : ""}`}
              />
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            {charCount} / {maxChars}
          </div>
        </div>
      </div>
    </div>
  );
}
