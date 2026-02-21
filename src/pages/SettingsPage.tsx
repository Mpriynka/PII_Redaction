import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PIILegend } from "@/components/PIILegend";

export default function SettingsPage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Toggle between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4" />
            <Switch checked={dark} onCheckedChange={setDark} />
            <Moon className="h-4 w-4" />
            <Label className="ml-2 text-sm text-muted-foreground">{dark ? "Dark mode" : "Light mode"}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PII Categories</CardTitle>
          <CardDescription>Color legend used across the application</CardDescription>
        </CardHeader>
        <CardContent>
          <PIILegend />
        </CardContent>
      </Card>

    </div>
  );
}
