
// import { NextResponse } from "next/server";

// // Use localhost for local development, or set via environment variable
// // Use localhost for local development, or set via environment variable
// const BASE_URL = (
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
//   // process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000"
// ).replace(/\/$/, "");

// async function proxyRequest(method: string, req: Request, params: any) {
//   try {
//     const urlPath = params.path.join("/");

//     // GET should not try reading body
//     let body: any = null;
//     if (method !== "GET") {
//       try {
//         body = await req.json();
//       } catch (_) {}
//     }

//     // Forward headers from the original request, especially Authorization
//     const headers: HeadersInit = {
//       "Content-Type": "application/json",
//     };

//     // Get Authorization header from the incoming request
//     const authHeader = req.headers.get("Authorization");
//     if (authHeader) {
//       headers["Authorization"] = authHeader;
//     }

//     // Forward cookies
//     const cookieHeader = req.headers.get("cookie");
//     if (cookieHeader) {
//       headers["cookie"] = cookieHeader;
//     }

//     // Dev logging: show cookie/auth headers received by proxy
//     if (process.env.NODE_ENV !== "production") {
//       try {
//         console.log("[proxy] forwarding request", method, urlPath);
//         console.log("[proxy] incoming Authorization:", authHeader);
//         console.log("[proxy] incoming cookie:", cookieHeader);
//       } catch (e) {}
//     }

//     const response = await fetch(`${BASE_URL}/${urlPath}`, {
//       method,
//       headers,
//       body: body ? JSON.stringify(body) : undefined,
//     });

//     // Read response as text first (some responses may not be JSON)
//     const text = await response.text().catch(() => "");
//     let data: any = null;
//     try {
//       data = text ? JSON.parse(text) : null;
//     } catch (e) {
//       data = text;
//     }

//     // Dev logging: show backend response status/body
//     if (process.env.NODE_ENV !== "production") {
//       try {
//         console.log("[proxy] backend response status:", response.status);
//         console.log(
//           "[proxy] backend response body:",
//           typeof data === "string"
//             ? data.slice(0, 200)
//             : JSON.stringify(data).slice(0, 200)
//         );
//       } catch (e) {}
//     }

//     const resHeaders = new Headers();
//     if (response.headers.get("set-cookie")) {
//       resHeaders.append("set-cookie", response.headers.get("set-cookie")!);
//     }

//     return NextResponse.json(data, {
//       status: response.status,
//       headers: resHeaders,
//     });
//   } catch (err: any) {
//     console.error("Proxy error details:", {
//       error: err?.message,
//       stack: err?.stack,
//       cause: err?.cause,
//     });
//     return NextResponse.json(
//       {
//         error: "Proxy error",
//         message: err?.message || "Unknown error",
//         details: err?.stack,
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(req: Request, context: any) {
//   const params = await context.params;
//   return proxyRequest("GET", req, params);
// }

// export async function POST(req: Request, context: any) {
//   const params = await context.params;
//   return proxyRequest("POST", req, params);
// }

// export async function PUT(req: Request, context: any) {
//   const params = await context.params;
//   return proxyRequest("PUT", req, params);
// }

// export async function DELETE(req: Request, context: any) {
//   const params = await context.params;
//   return proxyRequest("DELETE", req, params);
// }