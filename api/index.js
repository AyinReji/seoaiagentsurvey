/**
 * Vercel Node.js Serverless Function — SSR Entry Point
 * =====================================================
 * This file is the Vercel serverless function that handles ALL page requests
 * and server function RPCs (email notifications, etc).
 *
 * WHY THIS EXISTS:
 * The TanStack Start build emits dist/server/server.js which exports a
 * Web Fetch API handler: { fetch(request: Request): Promise<Response> }
 *
 * Vercel's Node.js serverless functions use the Node.js HTTP format:
 * (req: IncomingMessage, res: ServerResponse) => void
 *
 * This file bridges the two: converts Node.js IncomingMessage → Web Request,
 * calls the TanStack Start handler, then writes the Web Response back to
 * Node.js ServerResponse.
 *
 * RUNTIME: Node.js (required — the server bundle uses node:async_hooks)
 */

import { createServer } from "node:http";
import { Readable } from "node:stream";

// Import the built TanStack Start server handler
// dist/server/server.js exports: { default: { fetch(req, env, ctx): Promise<Response> } }
let handler;
async function getHandler() {
    if (!handler) {
        const mod = await import("../dist/server/server.js");
        handler = mod.default;
    }
    return handler;
}

/**
 * Convert a Node.js IncomingMessage to a Web API Request.
 */
async function nodeRequestToWebRequest(req) {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const url = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value == null) continue;
        if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
        } else {
            headers.set(key, value);
        }
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body = null;
    if (hasBody) {
        body = await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => resolve(Buffer.concat(chunks)));
            req.on("error", reject);
        });
    }

    return new Request(url.toString(), {
        method: req.method,
        headers,
        body: hasBody && body?.length ? body : null,
    });
}

/**
 * Write a Web API Response back to a Node.js ServerResponse.
 */
async function webResponseToNodeResponse(webResponse, res) {
    res.statusCode = webResponse.status;
    res.statusMessage = webResponse.statusText || "";

    for (const [key, value] of webResponse.headers.entries()) {
        res.setHeader(key, value);
    }

    if (webResponse.body) {
        const reader = webResponse.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        } finally {
            reader.releaseLock();
        }
    }

    res.end();
}

/**
 * Main Vercel serverless function handler.
 */
export default async function vercelHandler(req, res) {
    try {
        const h = await getHandler();
        const webRequest = await nodeRequestToWebRequest(req);
        const webResponse = await h.fetch(webRequest, process.env, {});
        await webResponseToNodeResponse(webResponse, res);
    } catch (error) {
        console.error("[vercel-handler] Unhandled error:", error);
        res.statusCode = 500;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(`<!doctype html><html><body><h1>500 — Server Error</h1><p>${process.env.NODE_ENV === "development" ? String(error) : "An unexpected error occurred."
            }</p></body></html>`);
    }
}

export const config = {
    maxDuration: 30,
};