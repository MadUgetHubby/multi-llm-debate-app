import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DebateHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: debates = [], isLoading } = trpc.debate.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading debates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Debate History</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {debates.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600 mb-4">No debates yet</p>
              <Button onClick={() => setLocation("/")}>Start a Debate</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {debates.map((debate) => (
              <Card key={debate.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{debate.inquiry}</CardTitle>
                      <CardDescription className="mt-2">
                        Created {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge
                        variant={
                          debate.status === "completed"
                            ? "default"
                            : debate.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
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
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6 text-sm text-slate-600">
                      <span>{debate.numberOfRounds} rounds</span>
                      {debate.completedAt && (
                        <span>
                          Completed{" "}
                          {formatDistanceToNow(new Date(debate.completedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/debate/${debate.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>

                  {debate.finalSynthesis && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Final Answer Preview:</p>
                      <p className="text-sm text-slate-700 line-clamp-3">{debate.finalSynthesis}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
