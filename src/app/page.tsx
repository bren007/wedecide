
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, ArrowRight, Target, FileText, Landmark, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { registerInterest } from './actions';
import { useToast } from '@/hooks/use-toast';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-primary-foreground"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tighter text-primary">WeDecide</h2>
    </div>
  );
}

function InterestForm() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        const result = await registerInterest(email);
        setLoading(false);

        if (result.success) {
            setSubmitted(true);
        } else {
            toast({
              variant: 'destructive',
              title: 'An error occurred',
              description: result.message,
            });
        }
    };

    if (submitted) {
        return (
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="font-semibold">Thank you for your interest!</h3>
                <p className="text-sm">We will be in touch with you shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
            <div className="flex gap-2">
                <Input
                    type="email"
                    placeholder="Enter your work email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    aria-label="Email for interest registration"
                    disabled={loading}
                />
                <Button type="submit" size="lg" disabled={loading}>
                    {loading && <Loader2 className="animate-spin mr-2"/>}
                    Register Interest
                </Button>
            </div>
             {error && <p className="text-destructive text-sm text-center">{error}</p>}
        </form>
    );
}


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" asChild>
           <Link href="mailto:contact@wedecide.com">Contact Us</Link>
        </Button>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <Badge className="mb-4">An Intelligent Operating System for Governance</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Make Decisions that Drive Impact.
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
            WeDecide is pioneering a new approach for public sector and multilateral organizations to prepare, make, and track critical decisions—ensuring every choice is fast, smart, and explicitly tied to strategic outcomes.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/prototype">
                See the Prototype in Action <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Problem Section */}
        <section className="bg-muted/50 py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Is Your Decision-Making Process Fit for the 21st Century?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Public sector organizations face immense pressure to deliver results, yet rely on decision-making workflows that are slow, fragmented, and disconnected from strategy. This leads to wasted resources, missed opportunities, and a failure to deliver measurable public good.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-center">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Slow Preparation</h3>
                <p className="text-muted-foreground">Endless document revisions and disconnected email chains delay decisions for weeks or months.</p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Lost Knowledge</h3>
                <p className="text-muted-foreground">Critical context and rationale are lost in meeting rooms and personal inboxes, creating an incomplete audit trail.</p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">No Impact Tracking</h3>
                <p className="text-muted-foreground">Decisions are made, but their real-world impact on strategic goals is rarely measured or understood.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="py-20 md:py-24">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge>The WeDecide Solution</Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-4">A Single Source of Truth for Governance</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  WeDecide transforms decision-making into a structured, intelligent, and auditable process.
                </p>
                <ul className="space-y-6 mt-8">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0"><Check className="text-primary"/></div>
                    <div>
                      <h4 className="font-semibold">AI-Augmented Preparation</h4>
                      <p className="text-muted-foreground">Leverage intelligent agents to rapidly draft high-quality decision briefs, aligned to best-practice standards and organizational knowledge.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0"><Check className="text-primary"/></div>
                    <div>
                      <h4 className="font-semibold">Explicit Strategic Alignment</h4>
                      <p className="text-muted-foreground">Ensure every proposal is explicitly linked to a strategic objective, with a clear score to guide decision-making groups.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0"><Check className="text-primary"/></div>
                    <div>
                      <h4 className="font-semibold">The Decision Bank</h4>
                      <p className="text-muted-foreground">Create a dynamic, searchable repository of every decision, providing a complete audit trail and a foundation for continuous improvement.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Target className="mr-2" />Decision Brief: Example</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h4 className="font-semibold text-foreground">Business Case for Public Feedback Software</h4>
                        <p className="text-sm text-muted-foreground">This business case seeks approval for the procurement of a new SaaS solution to manage public feedback, directly supporting the "Improve Citizen Service Score by 15%" objective.</p>
                        <div className="flex justify-between items-center bg-background p-3 rounded-md">
                           <div>
                                <p className="text-sm font-semibold text-muted-foreground">Strategic Alignment</p>
                                <p className="text-2xl font-bold text-green-600">85%</p>
                           </div>
                           <div>
                                <p className="text-sm font-semibold text-muted-foreground">Decision Cycle</p>
                                <p className="text-2xl font-bold">12 Days</p>
                           </div>
                        </div>
                    </CardContent>
                </Card>
              </div>
           </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="bg-primary/5 py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Help Us Shape the Future of Governance</h2>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
              We are currently engaging with pioneering public sector and multilateral organizations to refine our vision. If you are interested in solving these challenges, we would love to hear from you.
            </p>
            <div className="mt-8">
              <InterestForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} WeDecide. All rights reserved.</p>
      </footer>
    </div>
  );
}
