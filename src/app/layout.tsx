import { Geist, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";  // resets first
import "./globals.css";        // Tailwind last so it wins
import ClientLayout from "./clientlayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import "antd/dist/reset.css";
// import { headers } from 'next/headers';
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // Adjust this import path as needed
// import ClientLayout from "./clientlayout";
// import Script from "next/script";
// import { getAuthToken } from "./actions/action";
 
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
 
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
 
// export default async function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   // Server-side code
//   // const headersList = headers();
//   // const nonce = await headersList.get('x-nonce') || '';
//   const nonce =  (await headers()).get('x-nonce') || ''
//   const session = await getServerSession(authOptions);
//   const auth = getAuthToken()

//   return (
// <html lang="en">
// <head>
// <Script id="inline-script" nonce={nonce} strategy="beforeInteractive">
//           {/* {`console.log("✅ Secure inline script is working!");`} */}
// </Script>
// <link
//           rel="icon"
//           href="https://www.malaysiaairports.com.my/Logo.svg"
//           sizes="any"
//         />
// </head>
// <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
// >
// <ClientLayout session={session} auth={auth}>
//           {children}
// </ClientLayout>
// </body>
// </html>
//   );
// }
// src/app/layout.tsx