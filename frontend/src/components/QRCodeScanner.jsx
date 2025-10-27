// frontend/src/components/QRCodeScanner.jsx

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaQrcode, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

/**
 * QR Code Scanner Component
 * Scans QR codes using device camera
 */
function QRCodeScanner({
  onScan,
  onError,
  onClose,
  width = 300,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera if available
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch(err => {
        console.error('Error getting cameras:', err);
        setError('Failed to access camera');
      });

    // Cleanup
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps,
          qrbox,
          aspectRatio,
          disableFlip
        },
        (decodedText, decodedResult) => {
          console.log('✅ QR Code scanned:', decodedText);
          setResult(decodedText);
          setScanning(false);

          // Call callback
          if (onScan) {
            onScan(decodedText, decodedResult);
          }

          // Stop scanning after successful scan
          stopScanning();
        },
        (errorMessage) => {
          // This is called continuously while scanning
          // We don't show these errors as they're normal
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start scanner');
      setScanning(false);

      if (onError) {
        onError(err);
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleCameraChange = (e) => {
    const cameraId = e.target.value;
    setSelectedCamera(cameraId);

    // Restart scanning if currently scanning
    if (scanning) {
      stopScanning().then(() => {
        setTimeout(startScanning, 500);
      });
    }
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaQrcode className="text-indigo-600" />
          Scan QR Code
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        )}
      </div>

      {/* Camera Selector */}
      {cameras.length > 1 && (
        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            value={selectedCamera || ''}
            onChange={handleCameraChange}
            disabled={scanning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner View */}
      <div
        id="qr-reader"
        ref={scannerRef}
        className="w-full rounded-lg overflow-hidden border-2 border-gray-300 mb-4"
        style={{ maxWidth: width }}
      ></div>

      {/* Error Message */}
      {error && (
        <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {result && (
        <div className="w-full mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <FaCheckCircle className="text-green-600 text-xl" />
            <span className="text-green-800 font-semibold">QR Code Scanned!</span>
          </div>
          <p className="text-sm text-gray-700 break-all">
            {result.length > 100 ? `${result.slice(0, 100)}...` : result}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 w-full">
        {!scanning && !result && (
          <button
            onClick={startScanning}
            disabled={!selectedCamera}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCamera />
            Start Scanning
          </button>
        )}

        {scanning && (
          <button
            onClick={stopScanning}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            <FaTimes />
            Stop Scanning
          </button>
        )}

        {result && !scanning && (
          <button
            onClick={() => {
              setResult(null);
              setError(null);
              startScanning();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <FaCamera />
            Scan Again
          </button>
        )}
      </div>

      {/* Instructions */}
      {!scanning && !result && !error && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>Click "Start Scanning" to use your camera</p>
          <p className="text-xs mt-1">Position the QR code within the frame</p>
        </div>
      )}
    </div>
  );
}

export default QRCodeScanner;
