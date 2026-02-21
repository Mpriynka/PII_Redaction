import { Chrome, Download, Shield, Zap, Eye, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
    {
        icon: Eye,
        title: "Auto-Detect on Pages",
        description: "Scans visible text on any webpage and highlights PII in real-time.",
    },
    {
        icon: Shield,
        title: "One-Click Redaction",
        description: "Redact detected PII before copying, screenshotting, or sharing.",
    },
    {
        icon: Zap,
        title: "Same ML Model",
        description: "Uses the same DistilBERT model as the app — runs 100% locally in your browser.",
    },
    {
        icon: Settings2,
        title: "Customizable Rules",
        description: "Configure which PII types to detect and choose your redaction style.",
    },
];

export default function BrowserExtension() {
    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Chrome className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Browser Extension</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Bring PII redaction to every webpage. Detect and mask sensitive data directly in your browser — no data ever leaves your device.
                </p>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {FEATURES.map((f) => (
                    <Card key={f.title} className="border-dashed">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <f.icon className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">{f.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{f.description}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-muted/50">
                <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                        The extension is currently in development. Join the waitlist to get early access.
                    </p>
                    <Button disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Download Extension
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
