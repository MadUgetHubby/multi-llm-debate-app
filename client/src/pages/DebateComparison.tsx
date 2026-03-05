import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function DebateComparison() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [debate1Id, setDebate1Id] = useState<string>("");
  const [debate2Id, setDebate2Id] = useState<string>("");

  const { data: debates = [] } = trpc.debate.list.useQuery({});

  const { data: comparison, isLoading: comparisonLoading } = trpc.debate.compare.useQuery(
    {
      debateId1: parseInt(debate1Id),
      debateId2: parseInt(debate2Id),
    },
    {
      enabled: !!debate1Id && !!debate2Id && debate1Id !== debate2Id,
    }
  );

  const handleCompare = () => {
    if (debate1Id && debate2Id && debate1Id !== debate2Id) {
      // Query will automatically trigger
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Compare Debates</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Selection Section */}
        <Card className="mb-8 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Select Debates to Compare</CardTitle>
            <CardDescription>Choose two debates to view side-by-side comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">First Debate</label>
                <Select value={debate1Id} onValueChange={setDebate1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a debate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {debates.map((debate) => (
                      <SelectItem key={debate.id} value={debate.id.toString()}>
                        {debate.inquiry.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Second Debate</label>
                <Select value={debate2Id} onValueChange={setDebate2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a debate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {debates.map((debate) => (
                      <SelectItem key={debate.id} value={debate.id.toString()}>
                        {debate.inquiry.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {debate1Id === debate2Id && debate1Id && (
              <p className="text-sm text-amber-600">Please select two different debates</p>
            )}
          </CardContent>
        </Card>

        {/* Comparison View */}
        {comparisonLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading comparison...</p>
            </CardContent>
          </Card>
        ) : comparison ? (
          <div className="space-y-8">
            {/* Metrics Comparison */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Debate 1 Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 pb-3 border-b">Debate 1</h3>
                    {comparison.debate1.metrics ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Convergence Speed</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {comparison.debate1.metrics.convergenceSpeed} rounds
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Agent Agreement</p>
                          <p className="text-lg font-semibold text-green-600">
                            {comparison.debate1.metrics.agentAgreementRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Quality Improvement</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {comparison.debate1.metrics.qualityImprovement}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Complexity</p>
                          <Badge className="mt-1">{comparison.debate1.metrics.debateComplexity}</Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Metrics not available</p>
                    )}
                  </div>

                  {/* Debate 2 Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 pb-3 border-b">Debate 2</h3>
                    {comparison.debate2.metrics ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Convergence Speed</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {comparison.debate2.metrics.convergenceSpeed} rounds
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Agent Agreement</p>
                          <p className="text-lg font-semibold text-green-600">
                            {comparison.debate2.metrics.agentAgreementRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Quality Improvement</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {comparison.debate2.metrics.qualityImprovement}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Complexity</p>
                          <Badge className="mt-1">{comparison.debate2.metrics.debateComplexity}</Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Metrics not available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inquiries Comparison */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Debate 1</h3>
                    <p className="text-slate-700">{comparison.debate1.inquiry}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Debate 2</h3>
                    <p className="text-slate-700">{comparison.debate2.inquiry}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Synthesis Comparison */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle>Final Synthesis Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Debate 1 Answer</h3>
                    <div className="text-sm text-slate-700 max-h-96 overflow-y-auto">
                      <Streamdown>{comparison.debate1.finalSynthesis || "No synthesis available"}</Streamdown>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Debate 2 Answer</h3>
                    <div className="text-sm text-slate-700 max-h-96 overflow-y-auto">
                      <Streamdown>{comparison.debate2.finalSynthesis || "No synthesis available"}</Streamdown>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : debate1Id && debate2Id ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600">Select two different debates to compare</p>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
