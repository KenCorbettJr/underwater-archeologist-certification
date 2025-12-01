import type { Metadata } from "next";
import { Inter, Poppins, Fredoka } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Underwater Learning - Archeology Certification for Kids",
  description:
    "Dive into history with Underwater Learning! Learn underwater archeology through interactive games and become a certified junior underwater archeologist.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signUpFallbackRedirectUrl="/challenges"
      signInFallbackRedirectUrl="/challenges"
    >
      <html lang="en">
        <body
          className={`${inter.variable} ${poppins.variable} ${fredoka.variable} font-sans`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
