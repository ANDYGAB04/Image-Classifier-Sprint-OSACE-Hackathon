"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Loader2, Trash2, Bot, User, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DottedGlowBackground } from "@/components/dotted-glow-background";
import { SparklesText } from "@/components/sparkles-text";
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(0);
  const [maxConfidence, setMaxConfidence] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const min = minConfidence / 100;
      const max = maxConfidence / 100;
      const response = await axios.get("/api/history?limit=10", {
        params: {
          min_confidence: min,
          max_confidence: max,
        },
      });
      if (response.data.success) {
        setHistory(response.data.predictions);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, [minConfidence, maxConfidence]);

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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    console.log("startCamera called");
    setCameraError(null);
    setShowCamera(true);

    // Check if running in browser and if MediaDevices API is supported
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      console.log("Camera not supported");
      const isSecure =
        typeof window !== "undefined" &&
        (window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      let errorMsg = "Camera is not supported in this browser. ";
      if (!isSecure) {
        errorMsg =
          "Camera requires HTTPS connection. Please access this page via HTTPS or use localhost for development.";
      } else {
        errorMsg +=
          "Please use a modern browser like Chrome, Firefox, or Safari.";
      }
      setCameraError(errorMsg);
      setShowCamera(false);
      return;
    }

    console.log("Requesting camera access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      console.log("Camera access granted", stream);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      let errorMessage = "Failed to access camera. ";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage += "Please grant camera permissions and try again.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage += "No camera found on your device.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage += "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage += "Camera doesn't support the required settings.";
      } else if (
        error.name === "NotSupportedError" ||
        error.name === "TypeError"
      ) {
        errorMessage =
          "Camera requires HTTPS connection. Please access this page via HTTPS.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      setCameraError(errorMessage);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // Set the captured image as the selected file
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
          setPrediction(null);
        };
        reader.readAsDataURL(file);

        // Stop camera and auto-classify
        stopCamera();

        // Automatically run classification
        setTimeout(() => {
          handlePredictWithFile(file);
        }, 100);
      },
      "image/jpeg",
      0.95
    );
  };

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

  const handlePredictWithFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

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
      alert(
        "Prediction failed: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    await handlePredictWithFile(selectedFile);
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated dotted glow background */}
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

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-purple-900/10 to-indigo-900/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-8">
        {/* Header with futuristic design */}
        <div className="text-center text-white mb-12 relative">
          <div className="mb-8">
            {/* Decorative gradient lines */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3/4 max-w-2xl">
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-violet-500 to-transparent h-[2px] w-full blur-sm" />
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-violet-500 to-transparent h-px w-full" />
              <div className="absolute inset-x-40 top-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent h-[3px] w-3/4 blur-sm mx-auto" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-4 flex items-center justify-center gap-4 pt-8">
              <Bot className="w-12 h-12 md:w-16 md:h-16 text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-violet-200 to-violet-500">
                Robot vs Human
              </span>
            </h1>

            <div className="relative inline-block">
              <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
                AI Classifier
              </h2>
              {/* Animated underline */}
              <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse" />
            </div>
          </div>

          <p className="text-lg md:text-xl text-violet-200/90 max-w-2xl mx-auto">
            Advanced deep learning powered image classification system
          </p>

          {/* Decorative corner elements */}
          <div className="absolute -top-4 -left-4 w-32 h-32 border-l-2 border-t-2 border-violet-500/30 rounded-tl-3xl" />
          <div className="absolute -top-4 -right-4 w-32 h-32 border-r-2 border-t-2 border-purple-500/30 rounded-tr-3xl" />
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <div className="overflow-hidden bg-violet-950/40 backdrop-blur-xl border-2 border-violet-500/50 rounded-xl shadow-2xl shadow-violet-500/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-sm px-6 py-4 border-b border-violet-400/30">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Camera className="w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    Camera
                  </h3>
                  <p className="text-white/90 text-sm mt-1">
                    Position your subject and click Capture
                  </p>
                </div>

                {/* Content */}
                {cameraError ? (
                  <div className="p-8 text-center">
                    <div className="text-red-400 mb-4">
                      <X className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                      <p className="text-lg font-semibold mb-2">
                        Camera Access Error
                      </p>
                      <p className="text-sm text-violet-300">{cameraError}</p>
                    </div>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="border-violet-500/50 hover:bg-violet-500/20 text-violet-200 hover:text-white backdrop-blur-sm"
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative bg-black min-h-[400px] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[60vh] object-contain"
                      />
                      {/* Decorative corner overlays */}
                      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-violet-500/50 rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-violet-500/50 rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-violet-500/50 rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-violet-500/50 rounded-br-lg" />
                    </div>
                    <div className="p-6 flex gap-3 justify-center bg-gradient-to-r from-violet-950/50 to-purple-950/50 backdrop-blur-sm border-t border-violet-500/30">
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className="flex-1 max-w-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/50 border-0"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Capture Photo
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        size="lg"
                        className="border-violet-500/50 hover:bg-violet-500/20 text-violet-200 hover:text-white backdrop-blur-sm"
                      >
                        <X className="mr-2 h-5 w-5" />
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Upload className="w-6 h-6 text-violet-400" />
                Upload Image
              </h3>
              <p className="text-violet-200/70 text-sm">
                Drag and drop, use camera, or click to select an image
              </p>
            </div>

            {/* Camera Button */}
            <Button
              onClick={startCamera}
              variant="outline"
              className="w-full border-2 border-dashed border-violet-400/50 hover:border-violet-400 hover:bg-violet-500/20 bg-violet-950/30 text-white backdrop-blur-sm transition-all duration-300"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5 text-violet-400" />
              Use Camera
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-violet-500/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-violet-300 border border-violet-500/30">
                  Or
                </span>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/50"
                  : "border-violet-500/30 hover:border-violet-400/70 hover:bg-violet-950/30 bg-black/30 backdrop-blur-sm"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              <p className="text-sm text-violet-200">
                Click or drag image here
              </p>
              <p className="text-xs text-violet-300/60 mt-2">
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
                <div className="relative rounded-lg overflow-hidden ring-2 ring-violet-500/50 shadow-2xl shadow-violet-500/30 bg-black/50 backdrop-blur-sm">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 mx-auto"
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handlePredict}
                    disabled={loading || !selectedFile}
                    className="flex-1 max-w-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/50 border-0"
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
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="border-violet-500/50 hover:bg-violet-500/20 text-violet-200 hover:text-white backdrop-blur-sm"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-400" />
                Results
              </h3>
              <p className="text-violet-200/70 text-sm">
                Classification results will appear here
              </p>
            </div>

            {prediction ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-violet-600/90 to-purple-600/90 backdrop-blur-sm text-white rounded-lg p-8 text-center shadow-2xl shadow-violet-500/30 border border-violet-400/30">
                  <p className="text-sm opacity-90 mb-3">Prediction:</p>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {prediction.class === "robot" ? (
                      <Bot className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    ) : (
                      <User className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    )}
                    <SparklesText
                      text={prediction.class.toUpperCase()}
                      colors={{ first: "#ffffff", second: "#e0c3fc" }}
                      sparklesCount={15}
                      className="text-4xl md:text-5xl font-bold"
                    />
                  </div>
                  <Progress
                    value={prediction.confidence * 100}
                    className="mb-3 bg-white/30 h-3"
                  />
                  <p className="text-xl font-semibold">
                    Confidence: {(prediction.confidence * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-violet-300/60 py-16 bg-black/30 backdrop-blur-sm rounded-lg border border-violet-500/20">
                <Bot className="w-20 h-20 mx-auto mb-4 opacity-30 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
                <p className="text-lg">No prediction yet</p>
                <p className="text-sm mt-2">Upload an image to get started</p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-5 rounded-lg text-center border border-violet-500/30 shadow-lg shadow-violet-500/20 hover:border-violet-400/50 transition-all duration-300">
                <div className="text-3xl font-bold text-violet-300 mb-1">
                  {statistics.total_predictions}
                </div>
                <div className="text-xs text-violet-400/70 uppercase tracking-wide">
                  Total Predictions
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-5 rounded-lg text-center border border-violet-500/30 shadow-lg shadow-violet-500/20 hover:border-violet-400/50 transition-all duration-300">
                <div className="text-3xl font-bold text-violet-300 mb-1">
                  {statistics.average_confidence
                    ? `${(statistics.average_confidence * 100).toFixed(1)}%`
                    : "0%"}
                </div>
                <div className="text-xs text-violet-400/70 uppercase tracking-wide">
                  Avg Confidence
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-5 rounded-lg text-center border border-violet-500/30 shadow-lg shadow-violet-500/20 hover:border-violet-400/50 transition-all duration-300">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {statistics.predictions_by_class?.robot || 0}
                </div>
                <div className="text-xs text-violet-400/70 uppercase tracking-wide">
                  Robots
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-5 rounded-lg text-center border border-violet-500/30 shadow-lg shadow-violet-500/20 hover:border-violet-400/50 transition-all duration-300">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {statistics.predictions_by_class?.human || 0}
                </div>
                <div className="text-xs text-violet-400/70 uppercase tracking-wide">
                  Humans
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-indigo-400" />
                Recent Predictions
              </h3>
              <p className="text-violet-200/70 text-sm">
                View your classification history
              </p>
            </div>
            {history.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="bg-red-600/80 hover:bg-red-600 backdrop-blur-sm shadow-lg shadow-red-500/30"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Confidence Threshold Filter */}
          <div className="bg-gradient-to-r from-violet-950/60 to-purple-950/60 backdrop-blur-md p-6 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-violet-400 rounded-full" />
                Confidence Threshold Filter
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-violet-300 font-medium">
                      Minimum: {minConfidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value);
                        if (newMin <= maxConfidence) {
                          setMinConfidence(newMin);
                        }
                      }}
                      className="w-full h-2 bg-violet-900/50 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>
                  <div className="text-xs text-violet-400 font-medium">
                    {minConfidence}%
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-violet-300 font-medium">
                      Maximum: {maxConfidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={maxConfidence}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value);
                        if (newMax >= minConfidence) {
                          setMaxConfidence(newMax);
                        }
                      }}
                      className="w-full h-2 bg-violet-900/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div className="text-xs text-purple-400 font-medium">
                    {maxConfidence}%
                  </div>
                </div>

                <div className="flex gap-2 items-center justify-between pt-2 border-t border-violet-500/20">
                  <div className="text-xs text-violet-300">
                    <span className="font-semibold">{minConfidence}%</span>
                    <span className="text-violet-400"> — </span>
                    <span className="font-semibold">{maxConfidence}%</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setMinConfidence(0);
                      setMaxConfidence(100);
                    }}
                    variant="outline"
                    className="h-7 text-xs border-violet-500/50 text-violet-300 hover:bg-violet-500/20 backdrop-blur-sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {history.map((pred) => {
                const confidencePercent = pred.confidence * 100;
                const getConfidenceColor = (conf: number) => {
                  if (conf >= 90) return "from-green-500 to-emerald-500";
                  if (conf >= 75) return "from-cyan-500 to-blue-500";
                  if (conf >= 60) return "from-yellow-500 to-orange-500";
                  return "from-orange-500 to-red-500";
                };

                const getConfidenceBgColor = (conf: number) => {
                  if (conf >= 90) return "bg-green-500/20";
                  if (conf >= 75) return "bg-cyan-500/20";
                  if (conf >= 60) return "bg-yellow-500/20";
                  return "bg-orange-500/20";
                };

                return (
                  <div
                    key={pred.id}
                    className="flex flex-col gap-2 p-4 bg-violet-950/40 backdrop-blur-md rounded-lg hover:bg-violet-900/50 transition-all duration-300 border border-violet-500/30 hover:border-violet-400/50 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex-1 truncate text-violet-200 font-medium">
                        {pred.filename}
                      </span>
                      <Badge
                        variant={
                          pred.predicted_class === "robot"
                            ? "destructive"
                            : "default"
                        }
                        className={`mx-3 ${
                          pred.predicted_class === "robot"
                            ? "bg-red-500/80 hover:bg-red-500 shadow-lg shadow-red-500/30"
                            : "bg-green-500/80 hover:bg-green-500 shadow-lg shadow-green-500/30"
                        }`}
                      >
                        {pred.predicted_class.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrediction(pred.id)}
                        className="hover:bg-red-500/20 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-violet-300">
                            Confidence
                          </span>
                          <span
                            className={`text-xs font-bold ${getConfidenceBgColor(
                              confidencePercent
                            )} px-2 py-1 rounded`}
                          >
                            {confidencePercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getConfidenceColor(
                              confidencePercent
                            )} transition-all duration-300 rounded-full shadow-lg`}
                            style={{ width: `${confidencePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-violet-400/60">
                      {new Date(pred.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-violet-300/60 py-16 bg-black/30 backdrop-blur-sm rounded-lg border border-violet-500/20">
              <p className="text-lg">No predictions in range</p>
              <p className="text-sm mt-2">
                Try adjusting the confidence threshold to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
