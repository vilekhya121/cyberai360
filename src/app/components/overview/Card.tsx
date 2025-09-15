// app/components/Card.tsx
import { PropsWithChildren } from "react";

export default function Card({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      {title ? (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </div>
  );
}
