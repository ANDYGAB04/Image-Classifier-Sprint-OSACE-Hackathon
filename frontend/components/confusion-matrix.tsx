import { Card } from "@/components/ui/card";

interface ConfusionMatrixProps {
  matrix: {
    labels: string[];
    matrix: number[][];
    true_human_predicted_human: number;
    true_human_predicted_robot: number;
    true_robot_predicted_human: number;
    true_robot_predicted_robot: number;
  };
  metrics?: {
    accuracy: number;
    per_class_metrics: {
      human: {
        precision: number;
        recall: number;
        f1_score: number;
      };
      robot: {
        precision: number;
        recall: number;
        f1_score: number;
      };
    };
  };
}

export function ConfusionMatrix({ matrix, metrics }: ConfusionMatrixProps) {
  const totalPredictions =
    matrix.true_human_predicted_human +
    matrix.true_human_predicted_robot +
    matrix.true_robot_predicted_human +
    matrix.true_robot_predicted_robot;

  const getColor = (count: number, isCorrect: boolean) => {
    const percentage = (count / totalPredictions) * 100;
    if (isCorrect) {
      // Green shades for correct predictions
      if (percentage > 15) return "bg-green-600";
      if (percentage > 10) return "bg-green-500";
      if (percentage > 5) return "bg-green-400";
      return "bg-green-300";
    } else {
      // Red shades for incorrect predictions
      if (percentage > 15) return "bg-red-600";
      if (percentage > 10) return "bg-red-500";
      if (percentage > 5) return "bg-red-400";
      return "bg-red-300";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Confusion Matrix</h3>
        <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-4 sm:p-6 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20 overflow-x-auto">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 w-fit min-w-full sm:min-w-0 mx-auto">
            {/* Header row */}
            <div className="w-16 sm:w-24 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-bold text-violet-300" />
            <div className="w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-bold text-green-400 bg-green-500/10 rounded border border-green-500/30 px-1">
              Predicted: Human
            </div>
            <div className="w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-bold text-red-400 bg-red-500/10 rounded border border-red-500/30 px-1">
              Predicted: Robot
            </div>

            {/* True Human row */}
            <div className="w-16 sm:w-24 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-bold text-violet-300 bg-violet-500/10 rounded border border-violet-500/30 px-1">
              True: Human
            </div>
            <div
              className={`w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold text-white rounded border border-green-500/50 ${getColor(
                matrix.true_human_predicted_human,
                true
              )}`}
            >
              {matrix.true_human_predicted_human}
            </div>
            <div
              className={`w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold text-white rounded border border-red-500/50 ${getColor(
                matrix.true_human_predicted_robot,
                false
              )}`}
            >
              {matrix.true_human_predicted_robot}
            </div>

            {/* True Robot row */}
            <div className="w-16 sm:w-24 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-bold text-violet-300 bg-violet-500/10 rounded border border-violet-500/30 px-1">
              True: Robot
            </div>
            <div
              className={`w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold text-white rounded border border-red-500/50 ${getColor(
                matrix.true_robot_predicted_human,
                false
              )}`}
            >
              {matrix.true_robot_predicted_human}
            </div>
            <div
              className={`w-24 sm:w-32 h-10 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold text-white rounded border border-green-500/50 ${getColor(
                matrix.true_robot_predicted_robot,
                true
              )}`}
            >
              {matrix.true_robot_predicted_robot}
            </div>
          </div>

          <div className="mt-4 text-xs text-violet-300 space-y-1">
            <p>
              ✓ True Positives: Robot classified as Robot:{" "}
              {matrix.true_robot_predicted_robot}
            </p>
            <p>
              ✓ True Negatives: Human classified as Human:{" "}
              {matrix.true_human_predicted_human}
            </p>
            <p>
              ✗ False Positives: Human classified as Robot:{" "}
              {matrix.true_human_predicted_robot}
            </p>
            <p>
              ✗ False Negatives: Robot classified as Human:{" "}
              {matrix.true_robot_predicted_human}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Performance Metrics
          </h3>

          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Overall Accuracy */}
            <div className="bg-gradient-to-br from-violet-600/90 to-purple-600/90 backdrop-blur-sm text-white rounded-lg p-6 text-center shadow-2xl shadow-violet-500/30 border border-violet-400/30 max-w-sm mx-auto w-full">
              <div className="text-4xl font-bold mb-2">
                {(metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-sm opacity-90">Overall Accuracy</div>
            </div>
          </div>

          {/* Per-class metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Human Metrics */}
            <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-4 sm:p-6 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
              <h4 className="text-base sm:text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-400 rounded-full" />
                Human Class Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-300">Precision:</span>
                  <span className="text-green-400 font-bold">
                    {(metrics.per_class_metrics.human.precision * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300">Recall:</span>
                  <span className="text-green-400 font-bold">
                    {(metrics.per_class_metrics.human.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300">F1-Score:</span>
                  <span className="text-green-400 font-bold">
                    {(metrics.per_class_metrics.human.f1_score * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Robot Metrics */}
            <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/60 backdrop-blur-md p-4 sm:p-6 rounded-lg border border-violet-500/30 shadow-lg shadow-violet-500/20">
              <h4 className="text-base sm:text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-400 rounded-full" />
                Robot Class Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-300">Precision:</span>
                  <span className="text-red-400 font-bold">
                    {(metrics.per_class_metrics.robot.precision * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300">Recall:</span>
                  <span className="text-red-400 font-bold">
                    {(metrics.per_class_metrics.robot.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300">F1-Score:</span>
                  <span className="text-red-400 font-bold">
                    {(metrics.per_class_metrics.robot.f1_score * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Explanations */}
          <div className="mt-4 bg-violet-950/40 backdrop-blur-md p-4 rounded-lg border border-violet-500/20 text-xs text-violet-300 space-y-2">
            <p>
              <strong>Precision:</strong> Of predictions made for this class,
              how many were correct
            </p>
            <p>
              <strong>Recall:</strong> Of all actual instances of this class,
              how many did the model identify
            </p>
            <p>
              <strong>F1-Score:</strong> Harmonic mean of precision and recall
              (balanced metric)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfusionMatrix;
