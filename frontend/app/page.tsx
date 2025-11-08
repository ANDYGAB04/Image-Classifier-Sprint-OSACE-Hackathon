"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Loader2, Trash2, Bot, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import axios from "axios";

interface Prediction {
  id: number;
  filename: string;
  predicted_class: string;
  confidence: number;
  timestamp: string;
}

interface Statistics {
  total_predictions: number;
  average_confidence: number;
  predictions_by_class: {
    robot: number;
    human: number;
  };
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    class: string;
    confidence: number;
  } | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_predictions: 0,
    average_confidence: 0,
    predictions_by_class: { robot: 0, human: 0 },
  });

  const loadHistory = useCallback(async () => {
    try {
      const response = await axios.get("/api/history?limit=10");
      if (response.data.success) {
        setHistory(response.data.predictions);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await axios.get("/api/statistics");
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadStatistics();
  }, [loadHistory, loadStatistics]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setPrediction(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/predict", formData);
      if (response.data.success) {
        setPrediction({
          class: response.data.predicted_class,
          confidence: response.data.confidence,
        });
        await loadHistory();
        await loadStatistics();
      } else {
        alert("Prediction failed: " + response.data.error);
      }
    } catch (error: any) {
      alert("Prediction failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setPrediction(null);
  };

  const handleDeletePrediction = async (id: number) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;

    try {
      await axios.delete(`/api/prediction/${id}`);
      await loadHistory();
      await loadStatistics();
    } catch (error) {
      alert("Failed to delete prediction");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL predictions?")) return;

    try {
      const response = await axios.delete("/api/predictions");
      if (response.data.success) {
        alert(`Deleted ${response.data.count} predictions`);
        await loadHistory();
        await loadStatistics();
      }
    } catch (error) {
      alert("Failed to clear predictions");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <Bot className="w-10 h-10" />
            Robot vs Human Classifier
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            AI-powered image classification using deep learning
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Drag and drop or click to select an image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click or drag image here
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supported: JPG, PNG, GIF, BMP
                </p>
              </div>

              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {preview && (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-lg"
                  />

                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handlePredict}
                      disabled={loading || !selectedFile}
                      className="flex-1 max-w-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Classify Image"
                      )}
                    </Button>
                    <Button onClick={handleClear} variant="outline">
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Classification results will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prediction ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg p-6 text-center">
                    <p className="text-sm opacity-90 mb-2">Prediction:</p>
                    <div className="text-3xl font-bold uppercase mb-4 flex items-center justify-center gap-2">
                      {prediction.class === "robot" ? (
                        <Bot className="w-8 h-8" />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                      {prediction.class}
                    </div>
                    <Progress
                      value={prediction.confidence * 100}
                      className="mb-2 bg-white/30"
                    />
                    <p className="text-lg">
                      Confidence: {(prediction.confidence * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No prediction yet</p>
                  <p className="text-sm mt-2">Upload an image to get started</p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statistics.total_predictions}
                  </div>
                  <div className="text-xs text-gray-600">Total Predictions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statistics.average_confidence
                      ? `${(statistics.average_confidence * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                  <div className="text-xs text-gray-600">Avg Confidence</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {statistics.predictions_by_class?.robot || 0}
                  </div>
                  <div className="text-xs text-gray-600">Robots</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {statistics.predictions_by_class?.human || 0}
                  </div>
                  <div className="text-xs text-gray-600">Humans</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Predictions</CardTitle>
                <CardDescription>View your classification history</CardDescription>
              </div>
              {history.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((pred) => (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm flex-1 truncate">
                      {pred.filename}
                    </span>
                    <Badge
                      variant={pred.predicted_class === "robot" ? "destructive" : "default"}
                      className="mx-2"
                    >
                      {pred.predicted_class.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {(pred.confidence * 100).toFixed(1)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrediction(pred.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p>No predictions yet</p>
                <p className="text-sm mt-2">
                  Start classifying images to see your history
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
