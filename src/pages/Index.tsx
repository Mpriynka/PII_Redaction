import { Link } from "react-router-dom";
import { Shield, Chrome, Zap, Lock, Cpu, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">PII Redaction Dashboard</h1>
        <p className="text-muted-foreground mt-1">Privacy-first tools that run entirely in your browser.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Local Redaction Card */}
        <Card className="flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Local Redaction</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Paste or upload text and redact PII using regex + ML — entirely in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" /> 100% private — no data leaves your device</li>
              <li className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-primary" /> DistilBERT ML model runs in-browser</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" /> Side-by-side review with accept/reject</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/local">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Browser Extension Card */}
        <Card className="flex flex-col hover:shadow-md transition-shadow border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Chrome className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Browser Extension</CardTitle>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
            <CardDescription className="mt-2">
              Detect and redact PII on any webpage with a single click.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-primary" /> Auto-scan any webpage for PII</li>
              <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" /> Same ML model — fully local</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" /> Redact before copying or sharing</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/extension">Learn More</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
