'use client';

import { useState, useEffect } from 'react';

interface PDFUploaderProps {
  onPDFChange: (pdfUrl: string) => void;
  currentPDF?: string;
  label: string;
  placeholder?: string;
}

export default function PDFUploader({
  onPDFChange,
  currentPDF,
  label,
  placeholder = 'https://example.com/documento.pdf'
}: PDFUploaderProps) {
  const [pdfUrl, setPdfUrl] = useState(currentPDF || '');

  // Sync with currentPDF when it changes (language switch)
  useEffect(() => {
    setPdfUrl(currentPDF || '');
  }, [currentPDF]);

  const handleChange = (value: string) => {
    setPdfUrl(value);
    onPDFChange(value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input
        type="text"
        value={pdfUrl}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      />

      <p className="text-xs text-gray-500">
        Pega el enlace del PDF (Google Drive, Dropbox, Cloudinary, etc.)
      </p>

      {/* Current PDF Preview */}
      {pdfUrl && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700 truncate max-w-md">{pdfUrl}</span>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2"
            >
              Ver PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
