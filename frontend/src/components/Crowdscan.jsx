import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, Clock, Gift, AlertCircle, MapPin, Star } from 'lucide-react';

const Crowdscan = () => {
  const [step, setStep] = useState('scan');
  const [selectedLot, setSelectedLot] = useState(null);
  const [capturedMedia, setCapturedMedia] = useState([]);
  const [reportedOccupancy, setReportedOccupancy] = useState('');
  const [notes, setNotes] = useState('');
  const [inspectionData, setInspectionData] = useState(null);
  const fileInputRef = useRef(null);

  const parkingLots = [
    { id: '1', name: 'Galeria Lublin', capacity: 200, current: 145, city: 'Lublin' },
    { id: '2', name: 'Centrum Warszawa', capacity: 500, current: 420, city: 'Warszawa' },
    { id: '3', name: 'Stary Rynek Poznań', capacity: 150, current: 89, city: 'Poznań' }
  ];

  const mockRewards = [
    { id: '1', amount: 2.50, date: '2025-10-18', status: 'issued', type: 'Verification' },
    { id: '2', amount: 3.00, date: '2025-10-15', status: 'claimed', type: 'Discrepancy Report' },
    { id: '3', amount: 1.50, date: '2025-10-12', status: 'issued', type: 'Photo Quality' }
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const mediaUrls = files.map(file => URL.createObjectURL(file));
    setCapturedMedia([...capturedMedia, ...mediaUrls]);
  };

  const handleSubmitScan = () => {
    if (!selectedLot || capturedMedia.length === 0) {
      alert('Wybierz parking i dodaj przynajmniej jedno zdjęcie');
      return;
    }

    setStep('uploading');
    
    setTimeout(() => {
      setInspectionData({
        id: Math.random().toString(36).substr(2, 9),
        status: 'queued',
        submittedAt: new Date().toISOString(),
        estimatedReward: '2.50 PLN'
      });
      setStep('review');
    }, 2000);
  };

  const renderScanStep = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <h1 className="text-2xl font-bold mb-2">Crowdscan - Weryfikuj Parking</h1>
        <p className="text-blue-100">Pomóż weryfikować zajętość parkingów i zdobywaj nagrody!</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="mr-2 text-blue-600" size={20} />
          Wybierz Parking
        </h2>
        <div className="space-y-3">
          {parkingLots.map(lot => (
            <div
              key={lot.id}
              onClick={() => setSelectedLot(lot)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedLot?.id === lot.id 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{lot.name}</h3>
                  <p className="text-sm text-gray-600">{lot.city}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {lot.current} / {lot.capacity}
                  </div>
                  <div className="text-xs text-gray-500">Aktualne zajęcie</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLot && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Camera className="mr-2 text-blue-600" size={20} />
            Dodaj Zdjęcia
          </h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center mb-4 transition-colors"
          >
            <Upload className="mr-2" size={20} />
            Dodaj Zdjęcia/Wideo
          </button>

          {capturedMedia.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Wybrano: {capturedMedia.length} plik(ów)
              </p>

              <button
                onClick={handleSubmitScan}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Wyślij Skan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderUploadingStep = () => (
    <div className="max-w-md mx-auto p-6 mt-20">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Przetwarzanie...</h2>
        <p className="text-gray-600">Wysyłanie zdjęć i analiza...</p>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-2">Wysłano!</h2>
        <p className="text-center text-gray-600 mb-6">
          Twoja weryfikacja jest w kolejce do przeglądu
        </p>

        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Parking:</span>
            <span className="font-semibold">{selectedLot?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Szacowana nagroda:</span>
            <span className="font-semibold text-green-600">{inspectionData?.estimatedReward}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setStep('scan');
            setSelectedLot(null);
            setCapturedMedia([]);
          }}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Wyślij Kolejny Skan
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'scan' && renderScanStep()}
      {step === 'uploading' && renderUploadingStep()}
      {step === 'review' && renderReviewStep()}
    </div>
  );
};

export default Crowdscan;