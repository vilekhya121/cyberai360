import Image from "next/image";
import SendIcon from "../../../../public/chatbot/send.svg"

export default function SuggestedPrompts({ onPromptClick }: { onPromptClick: (text: string) => void }) {
  const prompts = [
    {
      text: "What is the average cpu usage of prod_vm_1??",
    },
    {
      text: "Give the status of the prod_vm_1?",
    },
    {
      text: "Give the vm availability status of prod_vm_1?",
    },
    {
      text: "what is the average memory utilization of prod_vm_1?",
    },
    {
      text: "List how many active connections in the bank_db_1?",
    },
    {
      text: "List the slow query coun for bank_db_1?",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3 max-w-4xl mx-auto mb-8">
      {prompts.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onPromptClick(prompt.text)}
          className="flex justify-between items-center px-4 py-4 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-700">{prompt.text}</span>
          </div>
          <span className="ml-2 text-[#204496] font-bold text-lg group-hover:translate-x-1 transition-transform">
            <Image src={SendIcon} alt="" aria-hidden="true" className="w-[18px] h-[18px]"/>
          </span>
        </button>
      ))}
    </div>
  );
}