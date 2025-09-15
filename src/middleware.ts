import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check session cookie
  //const sessionToken = request.cookies.get("__Secure-next-auth.session-token")?.value;
  //if (!sessionToken) {
    //return NextResponse.redirect(new URL("/auth", request.url));
  //}

  // Generate a unique nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";

  const cspHeader = isDevelopment
    ? `
        default-src 'self';
        frame-src 'self' https://accounts.google.com;
        script-src 'self' 'nonce-${nonce}' 'unsafe-eval';
        script-src-elem 'self' 'nonce-${nonce}' https://accounts.google.com/gsi/client;
        style-src 'self' https://accounts.google.com/gsi/style https://fonts.googleapis.com 'unsafe-inline';
        img-src 'self' data: https://www.malaysiaairports.com.my;
        font-src 'self' https://fonts.gstatic.com data:;
        object-src 'none';
        connect-src 'self' *.freshservice.com *.myairports.com.my *.malaysiaairports.com.my wss://mathops-be-nprod.myairports.com.my https://*.inc1.devtunnels.ms;
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
      `
    : `
        default-src 'self';
        frame-src 'self' https://accounts.google.com;
        script-src 'self' 'nonce-${nonce}' https://accounts.google.com/gsi/client;
        style-src 'self' https://accounts.google.com/gsi/style https://fonts.googleapis.com 'unsafe-inline';
        img-src 'self' data: https://www.malaysiaairports.com.my;
        font-src 'self' https://fonts.gstatic.com data:;
        object-src 'none';
        connect-src 'self' https://apim-magb.azure-api.net https://login.microsoftonline.com *.login.microsoftonline.com *.freshservice.com *.myairports.com.my wss://mathops-be-nprod.myairports.com.my https://*.inc1.devtunnels.ms;
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `;

  const cspHeaderValue = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeaderValue);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Security and CORS headers
  response.headers.set("Access-Control-Allow-Origin", "https://apim-magb.azure-api.net/apss-dev");
  response.headers.set("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", cspHeaderValue);
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};