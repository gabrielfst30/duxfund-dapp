import type { Metadata } from "next";
import { Space_Grotesk } from 'next/font/google'
import "../styles/globals.scss";

export const metadata: Metadata = {
  title: "DuxFund",
  description: "Your Favorite Funder DApp",
};

//Definições de estilo da fonte
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
