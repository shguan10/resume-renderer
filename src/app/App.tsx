import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/AppLayout';
import { AppTab } from '@/app/components/AppSidebar';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────
// Main content
// ─────────────────────────────────────────────
function MainContent() {
  return (
    <AppLayout
      title={"Hello! I'm Shane"}
      subtitle={"Welcome to my mind!"}
      onFeedback={() => {}}
      currentTab={"home"}
      onTabChange={(tab) => {
      }}
    >
      {<>
      <h1>Hello World!</h1>
      </>}
    </AppLayout>
  );
}

// ─────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────
export default function App() {
  return (
            <MainContent />
  );
}
