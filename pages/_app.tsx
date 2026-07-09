import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Conditionally hide "Add Notice" button when already on /notice/new
  const showAddButton = router.pathname !== "/notice/new";

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased font-sans">
        {/* Simple Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              Notice Board
            </Link>
            {showAddButton && (
              <Link href="/notice/new" passHref legacyBehavior>
                <Button size="sm" className="flex items-center gap-1.5 font-medium">
                  <PlusIcon className="size-4" />
                  <span>Add Notice</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          <Component {...pageProps} />
        </main>
      </div>
    </TooltipProvider>
  );
}
