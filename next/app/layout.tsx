import "./globals.css";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/1p/theme-provider";
import { ModeToggle } from "@/components/1p/mode-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSignInUrl, withAuth } from "@workos-inc/authkit-nextjs";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "broccolink",
  description: ``,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user } = await withAuth();

  // Get the URL to redirect the user to AuthKit to sign in
  const signInUrl = await getSignInUrl();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthKitProvider>
            <header className="w-full flex justify-between items-center border-b border-border p-4">
              {!user ? (
                <Link href={signInUrl}>
                  <Button variant="outline" size="sm" className="">
                    Sign in
                  </Button>
                </Link>
              ) : (
                <Link href={"/profile"}>
                  <Button variant="outline" size="sm" className="">
                    Profile
                  </Button>
                </Link>
              )}
              <ModeToggle />
            </header>
            <div className="flex-1">{children}</div>
          </AuthKitProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
