import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RedactionReview } from "@/components/RedactionReview";
import { loadModel, isModelLoaded, type ModelLoadProgress } from "@/lib/ml-pii";
import { runPipeline, type PipelineResult } from "@/lib/pii-pipeline";
import type { PIIEntity } from "@/lib/mock-data";

type Step = "load" | "input" | "processing" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "load", label: "Load Model" },
  { key: "input", label: "Input" },
  { key: "processing", label: "Redact" },
  { key: "review", label: "Review" },
];

export default function LocalRedaction() {
  const [step, setStep] = useState<Step>(isModelLoaded() ? "input" : "load");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState("Preparing download…");
  const [modelError, setModelError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Pipeline results
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  // Load model
  useEffect(() => {
    if (step !== "load") return;
    if (isModelLoaded()) {
      setStep("input");
      return;
    }

    setModelError(null);
    setModelProgress(0);
    setModelStatus("Initializing…");

    loadModel((p: ModelLoadProgress) => {
      setModelStatus(p.status);
      setModelProgress(p.progress);
    })
      .then(() => {
        setModelStatus("Ready!");
        setModelProgress(100);
        setTimeout(() => setStep("input"), 500);
      })
      .catch((err) => {
        console.error("Model load failed:", err);
        setModelError(
          `Failed to load model. Make sure model files are in public/models/pii-model/. Error: ${err.message}`
        );
      });
  }, [step]);

  // Run pipeline when processing
  useEffect(() => {
    if (step !== "processing") return;
    setProcessError(null);

    runPipeline(textInput)
      .then((result) => {
        setPipelineResult(result);
        setStep("review");
      })
      .catch((err) => {
        console.error("Pipeline error:", err);
        setProcessError(err.message);
        setStep("input");
      });
  }, [step, textInput]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Read text from the file
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setTextInput(content);
      }
    };
    reader.readAsText(file);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  if (step === "review" && pipelineResult) {
    return (
      <RedactionReview
        originalText={textInput}
        entities={pipelineResult.entities}
        onBack={() => setStep("input")}
      />
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Model Loading */}
      {step === "load" && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            {modelError ? (
              <>
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Model Load Failed</h2>
                <p className="text-sm text-destructive">{modelError}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => { setModelError(null); setStep("load"); }}>
                    Retry
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStep("input")}>
                    Continue without model (regex only)
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">Loading PII Detection Model</h2>
                <p className="text-sm text-muted-foreground">{modelStatus}</p>
                <Progress value={modelProgress} className="max-w-md mx-auto" />
                <p className="text-xs text-muted-foreground">{modelProgress}%</p>
                <Button variant="ghost" size="sm" onClick={() => setStep("input")}>
                  Skip (use regex only)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Input */}
      {step === "input" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Input Document</h2>
            {!isModelLoaded() && (
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                ML model not loaded — regex only
              </span>
            )}
          </div>
          {processError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {processError}
            </div>
          )}
          <Tabs defaultValue="paste">
            <TabsList>
              <TabsTrigger value="paste"><FileText className="h-3.5 w-3.5 mr-1.5" /> Paste Text</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="paste">
              <Textarea
                placeholder="Paste your text here…"
                className="min-h-[240px] font-mono text-sm"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="upload">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-12 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {fileName ? fileName : "Drop a .txt file here, or click to browse"}
                </span>
                <input type="file" accept=".txt,.csv,.md" className="hidden" onChange={handleFileUpload} />
              </label>
            </TabsContent>
          </Tabs>
          <Button onClick={() => setStep("processing")} disabled={!textInput} className="w-full">
            Start Redaction
          </Button>
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Detecting PII…</h2>
            <p className="text-sm text-muted-foreground">
              Running {isModelLoaded() ? "regex + ML model" : "regex"} pipeline
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
