import { Roboto, Roboto_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const robotoSerif = Roboto_Serif({
  variable: "--font-roboto-serif",
  subsets: ["latin"],
});

export const metadata = {
  title: "Madison Jay",
  description: "Dashboard for Madison Jay",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoSerif.variable} antialiased`}
      >
        <Toaster position="top right" />
        {children}
      </body>
    </html>
  );
}
