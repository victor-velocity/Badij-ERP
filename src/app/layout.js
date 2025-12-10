// app/layout.js
import { Roboto, Roboto_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import Footer from "@/components/Footer";
import ClientLayout from "@/components/ClientLayout";

config.autoAddCss = false;

const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"] });
const robotoSerif = Roboto_Serif({ variable: "--font-roboto-serif", subsets: ["latin"] });

export const metadata = {
  title: "Badij Technologies",
  description: "Dashboard for Badij Technologies",
};


export const revalidate = 0;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={' ${roboto.variable} ${robotoSerif.variable} antialiased'}>
        <Toaster position="top-right" />
        <ClientLayout>{children}<Footer /></ClientLayout>
      </body>
    </html>
  );
}

