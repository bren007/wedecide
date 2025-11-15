import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">WeDecide Lite</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The meeting OS for small teams that need to get things done.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
             <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
