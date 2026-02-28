import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, BarChart3 } from "lucide-react";
import { Streamdown } from "streamdown";

interface DebateMessage {
  id: number;
  debateId: number;
  roundNumber: number;
  agentName: string;
  agentPersona: string | null;
  messageType: string;
  content: string;
  createdAt: Date;
}

const AGENT_COLORS: { [key: string]: string } = {
  Strategist: "bg-blue-50 border-blue-200",
  Creative: "bg-purple-50 border-purple-200",
  Critic: "bg-amber-50 border-amber-200",
};

const AGENT_TEXT_COLORS: { [key: string]: string } = {
  Strategist: "text-blue-900",
  Creative: "text-purple-900",
  Critic: "text-amber-900",
};

const AGENT_BADGE_COLORS: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Strategist: "default",
  Creative: "secondary",
  Critic: "destructive",
};

export default function DebateDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/debate/:debateId");
  const debateId = params?.debateId ? parseInt(params.debateId) : null;

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  // Fetch debate
  const { data: debate, isLoading: debateLoading, refetch: refetchDebate } = trpc.debate.getById.useQuery(
    { debateId: debateId! },
    { enabled: !!debateId, refetchInterval: autoRefresh ? 2000 : false }
  );

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = trpc.debate.getMessages.useQuery(
    { debateId: debateId! },
    { enabled: !!debateId, refetchInterval: autoRefresh ? 2000 : false }
  );

  // Fetch metrics
  const { data: metrics } = trpc.debate.getMetrics.useQuery(
    { debateId: debateId! },
    { enabled: !!debateId && showMetrics }
  );

  useEffect(() => {
    if (debate?.status === "completed") {
      setAutoRefresh(false);
      toast.success("Debate completed!");
    }
  }, [debate?.status]);

  if (!match || !debateId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">Debate not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (debateLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading debate...</p>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">Debate not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group messages by round
  const messagesByRound: { [key: number]: DebateMessage[] } = {};
  messages.forEach((msg) => {
    if (!messagesByRound[msg.roundNumber]) {
      messagesByRound[msg.roundNumber] = [];
    }
    messagesByRound[msg.roundNumber].push(msg);
  });

  const rounds = Object.keys(messagesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const handleExport = () => {
    let content = `# Debate Transcript\n\n`;
    content += `**Inquiry:** ${debate.inquiry}\n\n`;
    content += `**Status:** ${debate.status}\n`;
    content += `**Rounds:** ${debate.numberOfRounds}\n\n`;

    rounds.forEach((round) => {
      content += `## Round ${round}\n\n`;
      messagesByRound[round].forEach((msg) => {
        content += `### ${msg.agentName} (${msg.messageType})\n\n`;
        content += `${msg.content}\n\n`;
      });
    });

    if (debate.finalSynthesis) {
      content += `## Final Synthesis\n\n${debate.finalSynthesis}\n`;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${debateId}-transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!debate.finalSynthesis}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Metrics
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{debate.inquiry}</h1>
              <div className="flex gap-2 items-center">
                <Badge variant={debate.status === "completed" ? "default" : "secondary"}>
                  {debate.status === "in_progress" && (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      In Progress
                    </>
                  )}
                  {debate.status === "completed" && "Completed"}
                  {debate.status === "pending" && "Pending"}
                  {debate.status === "failed" && "Failed"}
                </Badge>
                <span className="text-sm text-slate-600">
                  {debate.numberOfRounds} rounds
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Metrics Section */}
        {showMetrics && metrics && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle>Debate Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Convergence Speed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.convergenceSpeed} rounds
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Agent Agreement</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.agentAgreementRate}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Quality Improvement</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.qualityImprovement}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Complexity</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {metrics.debateComplexity}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debate Messages */}
        <div className="space-y-8">
          {rounds.length === 0 && debate.status === "pending" && (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-12 pb-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Initializing debate...</p>
              </CardContent>
            </Card>
          )}

          {rounds.map((round) => (
            <div key={round}>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {round === 0 ? "Initial Responses" : `Round ${round}`}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {messagesByRound[round].map((msg) => (
                  <Card
                    key={msg.id}
                    className={`border-2 ${AGENT_COLORS[msg.agentName] || "bg-slate-50"}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className={`text-lg ${AGENT_TEXT_COLORS[msg.agentName] || ""}`}>
                            {msg.agentName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {msg.agentPersona}
                          </CardDescription>
                        </div>
                        <Badge variant={AGENT_BADGE_COLORS[msg.agentName] || "outline"} className="text-xs">
                          {msg.messageType === "initial_response" && "Initial"}
                          {msg.messageType === "critique" && "Critique"}
                          {msg.messageType === "refined_response" && "Refined"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-700 max-h-64 overflow-y-auto">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Final Synthesis */}
        {debate.finalSynthesis && (
          <div className="mt-12">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Final Synthesis</CardTitle>
                <CardDescription className="text-green-800">
                  Judge's comprehensive answer combining all perspectives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-slate-900">
                  <Streamdown>{debate.finalSynthesis}</Streamdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {debate.status === "in_progress" && (
          <div className="mt-8 text-center">
            <p className="text-slate-600 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Debate in progress... Auto-refreshing
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
