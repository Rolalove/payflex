"use client";

import { Suspense } from "react";
import { SettingsPage } from "@/src/features/settings/components/SettingsPage";

export default function DashboardSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading settings...</div>}>
      <SettingsPage />
    </Suspense>
  );
}
