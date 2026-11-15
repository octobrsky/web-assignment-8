# Computational Systems & Network Engineering — Information Server

A lightweight Node.js and Express 5 information server demonstrating routing, custom middleware, static file serving, HTTP status codes, and Fetch API integration without external frameworks or template engines.

## How to Install and Run

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/octobrsky/web-assignment-8.git
   cd web-assignment-8
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   - Production mode: `npm start`
   - Development mode (auto-restart via Node's built-in watcher): `npm run dev`
4. Open `http://localhost:3000` in your browser.

## File Organization

```text
/assignment8
 ├─ public/
 │   ├─ index.html        # Semantic HTML page introducing the programme and API buttons
 │   ├─ styles.css        # External stylesheet for layout and status badges
 │   └─ app.js            # Client-side Fetch API calls and formatted response rendering
 ├─ server.js             # Express 5 server, middlewares, API routes, and 404 fallback
 ├─ package.json          # Project metadata, ES module flag, and npm scripts
 ├─ package-lock.json     # Exact dependency lockfile
 ├─ .gitignore            # Excludes node_modules/, .env, and OS metadata
 └─ README.md             # Documentation, curl test logs, and architectural reasoning
```

## Request Counting Policy & Middleware Order

- **Middleware Placement:** Both `requestLogger` and `requestCounter` are registered at the top of `server.js` before `express.static` and route handlers. Placing them first ensures every incoming HTTP request is logged and counted before any route terminates the request-response cycle.
- **What is Counted:** Every request hitting the server—including HTML/CSS/JS static assets, valid API calls, redirects, and 404 responses—increments `requestsServed`. Because the counter runs globally at entry, it accurately reflects total HTTP traffic handled by the Node.js process since startup.

## Testing Evidence (`curl --include`)

### 1. Successful JSON Response (`GET /api/courses`)
```http
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 268
ETag: W/"10c-xXk86l7tyeQwr7nFvoaqsVzxXYs"
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":"CS101","title":"Foundations of Distributed Systems","credits":6},{"id":"CS204","title":"Network Security & Cryptography","credits":5},{"id":"CS309","title":"Modern Web Engineering","credits":6},{"id":"CS412","title":"Applied Machine Intelligence","credits":5}]
```

### 2. Created Response (`POST /api/subscribe`)
```http
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 19
ETag: W/"13-oWAPIqDXuocNexKhPYW9ayyk98c"
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"subscribed":true}
```

### 3. Forbidden Response (`GET /api/admin`)
```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-TLNzmZqKxaTuFdX/dVWWPBu44/c"
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Forbidden"}
```

### 4. Redirect Response (`GET /old-page`)
```http
HTTP/1.1 302 Found
X-Powered-By: Express
Location: /hello
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 28
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Found. Redirecting to /hello
```

### 5. 404 Response on an `/api` Path (`GET /api/unknown`)
```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

### 6. 404 Response on a Non-API Path (`GET /nonexistent-page`)
```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 20
ETag: W/"14-uqvetqrE8oeY4r2Xn8/CTahXnYE"
Date: Sun, 15 Nov 2026 10:27:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

404 - Page not found
```

## Reasoning Questions

1. **Route order:** When I moved the 404 fallback middleware to the very top of `server.js` (before `/`, `/hello`, and `/api/*`), every single request returned a `404 Not Found` response. Express evaluates middleware and routes sequentially from top to bottom and stops at the first handler that sends a response without calling `next()`. Because the 404 handler has no path restriction, it intercepted all traffic before valid routes could ever be reached.
2. **Middleware:** After removing `next()` from `requestLogger`, the server printed the timestamp, method, and URL to the terminal as usual, but the browser tab spun indefinitely until timing out. Without `next()`, Express never passed execution control to subsequent middlewares or route handlers, leaving the HTTP response stream open and hanging.
3. **Status codes:** `POST /api/subscribe` returns `201 Created` because the request semantically creates a new subscription resource rather than merely retrieving existing data (`200 OK`). Returning `404 Not Found` for missing paths instead of `200 OK` with an error string allows automated clients, browsers, and `fetch()` (`response.ok`) to programmatically distinguish valid resources from missing endpoints via HTTP semantics.
4. **Configuration:** Reading the port from `process.env.PORT` with a `3000` fallback allows cloud hosting platforms and container orchestrators to dynamically assign an available port at runtime without modifying source code. Hard-coding `3000` would cause deployment failures if port `3000` is already occupied or restricted by the host environment.
5. **Dependencies:** `node_modules/` contains thousands of generated files that bloat repository size and differ across operating systems; `package.json` and `package-lock.json` already define the exact dependency tree reproducibly. After cloning the repository, a teammate must run `npm install` (or `npm ci`) to reconstruct `node_modules/` locally before starting the server.
6. **Same origin:** If `index.html` were opened directly from disk (`file:///...`), relative URLs like `/api/courses` would resolve against the local filesystem (`file:///api/courses`) instead of `http://localhost:3000`, causing `fetch()` to fail. Even if full `http://localhost:3000` URLs were used, browsers would block the request under the **Same-Origin Policy (SOP)** because `file://` and `http://localhost:3000` have different origins and the server sends no CORS headers.

## Self-Study Notes

- **Reading Node.js Process Metadata (`process.version` & `process.uptime()`):** Consulted the official Node.js `process` documentation. `process.version` returns the active Node.js runtime string (e.g., `v22.x.x`), while `process.uptime()` returns a floating-point number of seconds the current Node.js process has been running, which I rounded down with `Math.floor()` for clean JSON output.
- **Explicit Content-Type Headers (`res.type()`):** Reviewed the Express 5 `Response` API docs. Using `res.type("text/plain")` sets `Content-Type: text/plain; charset=utf-8` before calling `.send()`, ensuring routes like `/robots.txt` and `/hello` are not misinterpreted as HTML.
- **Pretty-Printing JSON in the Browser:** Used `JSON.stringify(data, null, 2)` inside `app.js` combined with a `<pre>` element so nested JSON objects and arrays render with 2-space indentation rather than a single compressed line.

## Challenges Faced

- **Express 5 Wildcard Routing Change:** Initially attempted `app.get("*", ...)` for the 404 handler, which threw a `PathError` in Express 5 due to updated `path-to-regexp` rules. Resolved this by using a pathless `app.use((req, res) => ...)` middleware at the bottom of the routing stack.
- **Working Directory Independence:** Running `node assignment8/server.js` from the parent directory initially broke `express.static("public")`. Resolved this by deriving `__dirname` via `fileURLToPath(import.meta.url)` and passing `path.join(__dirname, "public")` so static assets resolve reliably regardless of the current working directory.
