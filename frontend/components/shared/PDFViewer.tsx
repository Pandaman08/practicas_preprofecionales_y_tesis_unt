'use client';

interface PDFViewerProps {
  url: string;
  title?: string;
  height?: string;
}

export default function PDFViewer({ url, title = 'Documento PDF', height = '600px' }: PDFViewerProps) {
  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>
      <iframe
        src={url}
        title={title}
        style={{ height }}
        className="w-full"
      />
    </div>
  );
}
