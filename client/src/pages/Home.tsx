import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Zap, Brain, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [inquiry, setInquiry] = useState("");
  const [numberOfRounds, setNumberOfRounds] = useState([2]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDebate = trpc.debate.submit.useMutation({
    onSuccess: (data) => {
      toast.success("Debate submitted! Redirecting to debate view...");
      setTimeout(() => {
        setLocation(`/debate/${data.debateId}`);
      }, 500);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiry.trim()) {
      toast.error("Please enter an inquiry");
      return;
    }

    setIsSubmitting(true);
    await submitDebate.mutateAsync({
      inquiry: inquiry.trim(),
      numberOfRounds: numberOfRounds[0],
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">MultiLLM Debate</h1>
            </div>
            <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Get Better Answers Through AI Debate
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Submit your inquiry and watch multiple AI agents debate, critique, and synthesize the best possible answer.
            </p>
            <Button size="lg" onClick={() => (window.location.href = getLoginUrl())}>
              Get Started
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Zap className="w-6 h-6 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Real-Time Debate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Watch AI agents discuss your inquiry in real-time with live streaming updates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="w-6 h-6 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Multiple Perspectives</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Strategist, Creative, and Critic agents bring diverse viewpoints to every question.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertCircle className="w-6 h-6 text-green-500 mb-2" />
                <CardTitle className="text-lg">Synthesized Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  A Judge agent combines all perspectives into comprehensive, balanced answers.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show authenticated user interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">MultiLLM Debate</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={() => setLocation("/history")}>
              History
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Submit Your Inquiry</CardTitle>
              <CardDescription>
                Ask a question and watch AI agents debate to find the best answer
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Inquiry Input */}
                <div className="space-y-2">
                  <Label htmlFor="inquiry" className="text-base font-semibold">
                    Your Inquiry
                  </Label>
                  <Textarea
                    id="inquiry"
                    placeholder="e.g., What is the most efficient way to conduct research?"
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    className="min-h-32 resize-none"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-slate-500">
                    Be specific and detailed for better debate results
                  </p>
                </div>

                {/* Number of Rounds */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="rounds" className="text-base font-semibold">
                      Debate Rounds: {numberOfRounds[0]}
                    </Label>
                    <span className="text-sm text-slate-500">
                      More rounds = deeper debate (1-5)
                    </span>
                  </div>
                  <Slider
                    id="rounds"
                    min={1}
                    max={5}
                    step={1}
                    value={numberOfRounds}
                    onValueChange={setNumberOfRounds}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Quick</span>
                    <span>Thorough</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !inquiry.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Debate...
                    </>
                  ) : (
                    "Start Debate"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-blue-900">Strategist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800">
                  Focuses on efficiency, planning, and practical implementation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-purple-900">Creative</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-800">
                  Explores unconventional methods and innovative approaches.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-amber-900">Critic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800">
                  Identifies flaws, risks, and ensures accuracy and completeness.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
