import React from 'react';
import { MarkdownEditorView } from '@/app/views/MarkdownEditorView';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <MarkdownEditorView />
      <Toaster position="bottom-right" richColors />
    </>
  );
}
