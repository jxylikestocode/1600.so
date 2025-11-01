import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for admin cookie
    const adminCookie = request.cookies.get('admin_authenticated');

    if (!adminCookie) {
      // Check for password in query string
      const password = request.nextUrl.searchParams.get('password');
      const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (password === correctPassword) {
        // Set cookie and redirect to clean URL
        const response = NextResponse.redirect(new URL('/admin', request.url));
        response.cookies.set('admin_authenticated', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 hours
        });
        return response;
      }

      // Show password prompt
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Admin Login</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f3f4f6;
                margin: 0;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 100%;
              }
              h1 {
                font-size: 1.5rem;
                margin: 0 0 1.5rem;
                color: #111827;
              }
              input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                font-size: 1rem;
                box-sizing: border-box;
              }
              input:focus {
                outline: none;
                border-color: #3b82f6;
                ring: 2px;
                ring-color: #3b82f6;
              }
              button {
                width: 100%;
                padding: 0.75rem;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 0.375rem;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 1rem;
              }
              button:hover {
                background: #2563eb;
              }
              .hint {
                margin-top: 1rem;
                font-size: 0.875rem;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔐 Admin Login</h1>
              <form method="GET">
                <input
                  type="password"
                  name="password"
                  placeholder="Enter admin password"
                  required
                  autofocus
                />
                <button type="submit">Access Dashboard</button>
              </form>
              <div class="hint">
                Default password: admin123<br/>
                Set ADMIN_PASSWORD in .env.local to change
              </div>
            </div>
          </body>
        </html>
        `,
        {
          status: 401,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
