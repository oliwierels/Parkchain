// frontend/src/components/QRCodeGenerator.jsx

import { QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaQrcode } from 'react-icons/fa';

/**
 * QR Code Generator Component
 * Generates QR codes for reservations, charging sessions, etc.
 */
function QRCodeGenerator({
  value,
  size = 256,
  level = 'M', // L, M, Q, H
  includeMargin = true,
  title = 'QR Code',
  downloadable = true,
  downloadFilename = 'qr-code.svg',
  className = ''
}) {

  const handleDownload = () => {
    // Get the SVG element
    const svg = document.querySelector(`#qr-${value.slice(0, 10)}`);
    if (!svg) return;

    // Convert SVG to string
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!value) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="text-center text-gray-500">
          <FaQrcode className="text-4xl mx-auto mb-2 opacity-50" />
          <p className="text-sm">No QR data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaQrcode className="text-indigo-600" />
          {title}
        </h3>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <QRCodeSVG
          id={`qr-${value.slice(0, 10)}`}
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
          className="rounded"
        />
      </div>

      {downloadable && (
        <button
          onClick={handleDownload}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaDownload />
          Download QR Code
        </button>
      )}

      <p className="mt-2 text-xs text-gray-500 text-center max-w-xs break-all">
        {value.length > 50 ? `${value.slice(0, 50)}...` : value}
      </p>
    </div>
  );
}

export default QRCodeGenerator;
