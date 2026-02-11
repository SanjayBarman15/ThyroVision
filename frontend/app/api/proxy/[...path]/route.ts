import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function handler(req: NextRequest, path: string[]) {
  // Define these outside try block so they're available in catch block
  let targetBase: string;
  let urlPathWithSlash: string;

  try {
    // Force 127.0.0.1 to avoid IPv6 resolution issues with "localhost" on Node.js/Windows
    targetBase =
      BACKEND_URL?.replace("localhost", "127.0.0.1") || "http://127.0.0.1:8000";

    // Use the raw URL to preserve trailing slashes exactly as sent by the client
    const rawUrl = new URL(req.url);
    urlPathWithSlash = rawUrl.pathname.replace(/^\/api\/proxy/, "");

    const url = `${targetBase}${urlPathWithSlash}${rawUrl.search}`;

    console.log(
      `[Proxy] ${req.method} ${req.nextUrl.pathname}${req.nextUrl.search} -> ${url}`,
    );

    const headers = new Headers(req.headers);
    // Remove headers that should be set by the fetch call itself
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length"); // Let fetch calculate this for the new body

    // Forward authorization if exists
    const auth = req.headers.get("authorization");
    if (auth) {
      headers.set("authorization", auth);
    }

    // Handle body correctly for POST/PUT/PATCH
    let body: any;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        // Use clone() to avoid "already consumed" errors if something else read it
        body = await req.clone().arrayBuffer();
      } catch (e) {
        console.error("[Proxy] Failed to read request body:", e);
      }
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60s timeout

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: abortController.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    // Get the response body as a blob/arrayBuffer to support binary data (images, PDFs)
    const responseData = await response.arrayBuffer();

    // For error responses, try to parse JSON to show better error messages
    if (!response.ok) {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(responseData);
        const jsonError = JSON.parse(text);
        console.error(`[Proxy] Backend error response:`, jsonError);
      } catch (e) {
        // Not JSON, that's fine
      }
    }

    return new NextResponse(responseData, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error(
      `[Proxy Error] ${req.method} ${req.nextUrl.pathname}:`,
      error,
    );
    console.error(`[Proxy Debug] BACKEND_URL="${BACKEND_URL}"`);
    console.error(
      `[Proxy Debug] Trying to reach: ${targetBase}${urlPathWithSlash}`,
    );
    console.error(`[Proxy Debug] Error type: ${error.constructor.name}`);
    console.error(`[Proxy Debug] Error message: ${error.message}`);
    console.error(`[Proxy Debug] Error code: ${error.code}`);
    return NextResponse.json(
      {
        error: "Proxy Error",
        detail: error.message,
        backendUrl: targetBase,
        path: urlPathWithSlash,
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handler(req, path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handler(req, path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handler(req, path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handler(req, path);
}
