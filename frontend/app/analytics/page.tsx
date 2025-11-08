"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";
import ConfidenceChart from "@/components/confidence-chart";
import ConfusionMatrix from "@/components/confusion-matrix";
import { DottedGlowBackground } from "@/components/dotted-glow-background";

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

export default function Analytics() {
  const router = useRouter();
  const [confidenceData, setConfidenceData] = useState<ChartData | null>(null);
  const [classData, setClassData] = useState<ChartData | null>(null);
  const [confusionData, setConfusionData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"distribution" | "confusion">(
    "distribution"
  );

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [confidenceRes, classRes] = await Promise.all([
        axios.get("/api/analytics/confidence-distribution"),
        axios.get("/api/analytics/class-distribution"),
      ]);

      if (confidenceRes.data.success) {
        setConfidenceData(confidenceRes.data.chart_data);
      }

      if (classRes.data.success) {
        setClassData(classRes.data.chart_data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load analytics");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfusionMatrix = useCallback(async () => {
    setLoadingEval(true);
    setEvalError(null);

    try {
      const response = await axios.post("/api/analytics/evaluate", {
        test_dir: "data/test",
      });

      if (response.data.success) {
        const eval_data = response.data.evaluation;
        setConfusionData(eval_data.confusion_matrix);
        setMetrics({
          accuracy: eval_data.accuracy,
          per_class_metrics: eval_data.per_class_metrics,
          total_samples: eval_data.total_samples,
          human_samples: eval_data.human_samples,
          robot_samples: eval_data.robot_samples,
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to evaluate model";
      setEvalError(errorMsg);
      console.error("Evaluation error:", err);
    } finally {
      setLoadingEval(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <DottedGlowBackground
        className="w-full h-full"
        gap={20}
        radius={1.5}
        color="rgba(139, 92, 246, 0.3)"
        glowColor="rgba(139, 92, 246, 0.9)"
        opacity={0.8}
        backgroundOpacity={0.1}
        speedMin={0.3}
        speedMax={1.0}
        speedScale={0.8}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-purple-900/10 to-indigo-900/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.push("/")}
            className="border-2 border-violet-500/50 hover:border-violet-400 bg-transparent hover:bg-violet-500/20 text-violet-300 hover:text-white backdrop-blur-sm inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classifier
          </Button>
        </div>

        {/* Header */}
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-4">
            <Activity className="w-12 h-12 md:w-16 md:h-16 text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-violet-200 to-violet-500">
              Analytics & Metrics
            </span>
          </h1>
          <p className="text-lg md:text-xl text-violet-200/90">
            Model performance and prediction analysis
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 justify-center px-4">
          <Button
            onClick={() => setActiveTab("distribution")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2 rounded-lg border backdrop-blur-sm transition-all text-sm sm:text-base ${
              activeTab === "distribution"
                ? "bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-500/30"
                : "border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Distribution Analysis</span>
          </Button>
          <Button
            onClick={() => setActiveTab("confusion")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2 rounded-lg border backdrop-blur-sm transition-all text-sm sm:text-base ${
              activeTab === "confusion"
                ? "bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-500/30"
                : "border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
            }`}
          >
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Model Evaluation</span>
          </Button>
        </div>

        {/* Distribution Tab */}
        {activeTab === "distribution" && (
          <div className="space-y-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error Loading Analytics</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
            ) : (
              <>
                {confidenceData && classData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Confidence Distribution Chart */}
                    <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-8 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
                      <ConfidenceChart
                        title="Confidence Score Distribution"
                        data={confidenceData}
                        type="bar"
                      />
                    </div>

                    {/* Class Distribution Chart */}
                    <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-8 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
                      <ConfidenceChart
                        title="Prediction Class Distribution"
                        data={classData}
                        type="pie"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Confusion Matrix Tab */}
        {activeTab === "confusion" && (
          <div className="space-y-8">
            {!confusionData && !loadingEval && (
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-8 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20 text-center">
                <AlertCircle className="w-12 h-12 text-violet-400 mx-auto mb-4 opacity-50" />
                <p className="text-violet-300 mb-6">
                  Evaluate the model on the test dataset to view confusion
                  matrix and performance metrics.
                </p>
                <Button
                  onClick={loadConfusionMatrix}
                  disabled={loadingEval}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {loadingEval ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Run Evaluation
                    </>
                  )}
                </Button>
              </div>
            )}

            {loadingEval && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-violet-300">
                  Evaluating model on test dataset...
                </p>
              </div>
            )}

            {evalError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Evaluation Error</p>
                  <p className="text-sm">{evalError}</p>
                  <p className="text-xs mt-2">
                    Make sure you have test images in data/test/human/ and
                    data/test/robot/
                  </p>
                </div>
              </div>
            )}

            {confusionData && metrics && (
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-8 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
                <div className="mb-6 p-4 bg-violet-900/40 rounded-lg border border-violet-500/20">
                  <p className="text-violet-300 text-sm">
                    <span className="font-bold text-violet-200">
                      Test Set Summary:
                    </span>{" "}
                    Total: {metrics.total_samples} | Humans:{" "}
                    {metrics.human_samples} | Robots: {metrics.robot_samples}
                  </p>
                </div>
                <ConfusionMatrix matrix={confusionData} metrics={metrics} />

                <Button
                  onClick={loadConfusionMatrix}
                  variant="outline"
                  className="mt-6 border-violet-500/50 text-violet-300 hover:bg-violet-500/20"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Re-evaluate
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
