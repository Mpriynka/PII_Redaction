import { Link } from "react-router-dom";
import { Shield, Server, Zap, Globe, Lock, Cpu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">PII Redaction Dashboard</h1>
        <p className="text-muted-foreground mt-1">Choose a redaction mode to get started.</p>
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
              Process documents entirely in your browser. Your data never leaves your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-success" /> 100% private — no data sent to servers</li>
              <li className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-success" /> ML model runs in-browser (64MB download)</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-success" /> Instant results with side-by-side review</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/local">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Server Redaction Card */}
        <Card className="flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Server Redaction</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Upload larger documents for server-side processing with our advanced pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-success" /> Handle large documents with ease</li>
              <li className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-success" /> Multi-stage pipeline: Regex → Presidio → ML</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-success" /> Higher accuracy with ensemble approach</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/server">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
