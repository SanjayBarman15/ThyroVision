import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Configuration
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const PROXY_TIMEOUT = 60000; // 60 seconds

// Forbidden headers that should not be forwarded to the backend
const FORBIDDEN_REQUEST_HEADERS = [
  "host",
  "connection",
  "content-length",
  "expect",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

// Forbidden headers that should not be forwarded back to the client
const FORBIDDEN_RESPONSE_HEADERS = [
  "content-length",
  "transfer-encoding",
  "connection",
];

async function handleProxy(request: NextRequest, path: string[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

  try {
    const pathString = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/${pathString}${searchParams ? `?${searchParams}` : ""}`;

    console.log(`[Proxy] Forwarding ${request.method} to: ${targetUrl}`);

    // Prepare request headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!FORBIDDEN_REQUEST_HEADERS.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Ensure we don't hold the connection open
    headers.set("Connection", "close");

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal,
      cache: "no-store",
    };

    // Forward body for relevant methods
    if (!["GET", "HEAD"].includes(request.method) && request.body) {
      fetchOptions.body = request.body;
      // @ts-ignore - duplex is needed for streaming request bodies in some environments
      fetchOptions.duplex = "half";
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    // Stream the backend response
    const streamedResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy headers from backend response
    response.headers.forEach((value, key) => {
      if (!FORBIDDEN_RESPONSE_HEADERS.includes(key.toLowerCase())) {
        streamedResponse.headers.set(key, value);
      }
    });

    // Add a marker header for debugging
    streamedResponse.headers.set("X-Proxy-Source", "ThyroVision-NextJS");

    return streamedResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.error(
        `[Proxy Timeout]: Request to ${path.join("/")} timed out after ${PROXY_TIMEOUT}ms`,
      );
      return NextResponse.json(
        {
          error: "Gateway Timeout",
          details: "The backend server took too long to respond.",
        },
        { status: 504 },
      );
    }

    console.error(`[Proxy Error] ${request.method} ${path.join("/")}:`, error);

    // Attempt to return a more helpful error if possible
    return NextResponse.json(
      {
        error: "Bad Gateway",
        details: error.message || "Failed to communicate with backend",
        path: path.join("/"),
      },
      { status: 502 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path);
}
