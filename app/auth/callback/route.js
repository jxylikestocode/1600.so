import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Auth Callback Route Handler
 *
 * Handles OAuth callbacks from Google, Reddit, and Magic Link redirects
 * Exchanges the code for a session and redirects to the app
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();

    // Create Supabase client for route handler
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${origin}/?auth_error=true`);
      }

      console.log("Successfully exchanged code for session");
    } catch (error) {
      console.error("Error in auth callback:", error);
      // Redirect to home with error
      return NextResponse.redirect(`${origin}/?auth_error=true`);
    }
  }

  // Redirect to home page after successful authentication
  return NextResponse.redirect(origin);
}
