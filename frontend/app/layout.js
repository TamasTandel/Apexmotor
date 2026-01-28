import "./globals.css";
import Navbar from "../components/Navbar";
import { ClientStateProvider } from "../lib/clientState";
import dynamic from "next/dynamic";
const CompareBar = dynamic(() => import("../components/CompareBar"), { ssr: false });
import IntroVideo from "../components/IntroVideo";
import IntroGuard from "../components/IntroGuard";

export const metadata = {
  title: "AutoHub - Premium Car Dealership",
  description: "Find your dream car with AutoHub. Premium selection, transparent pricing, and hassle-free delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="font-sans antialiased bg-gray-900 text-gray-100">
        <ClientStateProvider>
          {/* <IntroGuard /> */}
          {/* <IntroVideo /> */}
          <Navbar />
          <main className="pt-16">
            <div className="animate-in opacity-0 translate-y-2 [animation:fadeUp_0.5s_ease-out_forwards]">
              {children}
            </div>
          </main>
          <CompareBar />
        </ClientStateProvider>
      </body>
    </html>
  );
}
