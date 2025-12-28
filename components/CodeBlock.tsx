
import React from 'react';

interface CodeBlockProps {
  code: string;
  title?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, title }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-lg">
      {title && (
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{title}</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
        </div>
      )}
      <pre className="p-4 text-slate-300 text-sm overflow-x-auto code-font">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
