import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, BookOpen, Printer } from 'lucide-react';
import { api } from '../services/api';

interface ExportVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  lovedOneId: number;
}

export const ExportVaultModal: React.FC<ExportVaultModalProps> = ({
  isOpen,
  onClose,
  lovedOneId
}) => {
  const [content, setContent] = useState<string>('');
  const [lovedOneName, setLovedOneName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.exportMemoryBook(lovedOneId)
      .then(res => {
        setContent(res.markdown_content);
        setLovedOneName(res.loved_one_name);
      })
      .catch(err => {
        console.error("Export error:", err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, lovedOneId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lovedOneName.replace(/[^a-zA-Z0-9]/g, '_')}_Heirloom_Memory_Book.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${lovedOneName} - Memory Book</title>
          <style>
            body { font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #111; }
            h1, h2, h3 { color: #8b3a0f; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            blockquote { border-left: 3px solid #8b3a0f; padding-left: 15px; font-style: italic; color: #444; }
          </style>
        </head>
        <body>
          <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/40 bg-obsidian-900/80">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-playfair text-xl font-bold text-amber-100">
                Export Heirloom Memory Book
              </h3>
              <p className="text-xs text-amber-300/70">
                Offline preservation archive for {lovedOneName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-obsidian-950/60 font-mono text-xs text-amber-200/90 leading-relaxed whitespace-pre-wrap selection:bg-amber-700 selection:text-white">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-stone-400">
              <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mr-3" />
              <span>Formatting Heirloom Chapters...</span>
            </div>
          ) : (
            content
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-amber-900/40 bg-obsidian-900/90 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone-400">
            Exported from 100% on-device SQLite database.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-900/60 bg-obsidian-900 text-stone-300 hover:text-amber-200 text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Album</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-900/60 bg-obsidian-900 text-stone-300 hover:text-amber-200 text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-candle-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
