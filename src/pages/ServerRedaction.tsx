import { useState, useEffect } from "react";
import { Upload, Loader2, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RedactionReview } from "@/components/RedactionReview";
import { UnderDevBanner } from '@/components/UnderDevBanner';

type Stage = "upload" | "processing" | "review";

const PIPELINE_STEPS = [
  { label: "Regex Patterns", duration: 1500 },
  { label: "Presidio Analyzer", duration: 2000 },
  { label: "ML Model", duration: 2500 },
];

export default function ServerRedaction() {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(-1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(1) + " KB");
    }
  };

  const startProcessing = () => {
    setStage("processing");
    setUploadProgress(0);
    setPipelineStep(-1);

    // Simulate upload
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(uploadInterval);
        runPipeline();
      }
    }, 50);
  };

  const runPipeline = () => {
    let stepIndex = 0;
    const runStep = () => {
      setPipelineStep(stepIndex);
      if (stepIndex < PIPELINE_STEPS.length) {
        setTimeout(() => {
          stepIndex++;
          runStep();
        }, PIPELINE_STEPS[stepIndex].duration);
      } else {
        setTimeout(() => setStage("review"), 500);
      }
    };
    runStep();
  };

  if (stage === "review") {
    return <RedactionReview onBack={() => setStage("upload")} />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <UnderDevBanner />
      <h1 className="text-2xl font-bold mb-2">Server Redaction</h1>
      <p className="text-muted-foreground mb-6">Upload larger documents for multi-stage server-side processing.</p>

      {stage === "upload" && (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-16 cursor-not-allowed opacity-50 bg-muted/50 border-muted-foreground/30">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Feature currently disabled
            </span>
            <input type="file" disabled accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" />
          </label>

          {/* Pipeline preview */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Processing Pipeline</p>
              <div className="flex items-center gap-2">
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-xs bg-muted rounded px-2 py-1 font-medium">{s.label}</div>
                    {i < PIPELINE_STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button disabled className="w-full">
            Upload & Process (Disabled)
          </Button>
        </div>
      )}

      {stage === "processing" && (
        <Card>
          <CardContent className="p-8 space-y-6">
            {uploadProgress < 100 ? (
              <div className="space-y-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="font-medium">Uploading {fileName}…</p>
                <Progress value={uploadProgress} className="max-w-md mx-auto" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-medium text-center mb-4">Processing document…</p>
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i < pipelineStep ? (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    ) : i === pipelineStep ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={i <= pipelineStep ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
