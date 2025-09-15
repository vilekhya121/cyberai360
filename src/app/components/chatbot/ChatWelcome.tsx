export default function ChatWelcome() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6 mb-6">
      <h1 className="text-3xl font-bold text-[#204496] mt-10">WELCOME TO INSIGHT AI BOT!</h1>
      <p className="text-slate-600 max-w-xl mt-3 leading-relaxed">
        How can I assist you today? You can ask about vulnerabilities, login anomalies, compliance
        stats, or access patterns. Just let me know what you need!
      </p>
    </div>
  );
}