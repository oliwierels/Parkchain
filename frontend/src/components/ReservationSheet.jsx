// frontend/src/components/ReservationSheet.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Spinner, Toast } from './ui'; // Importujemy Twoje komponenty UI
import PaymentMethodSelector from './PaymentMethodSelector';
import ParkingSuccessAnimation from './ParkingSuccessAnimation'; // Masz ten komponent, użyjmy go!
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/solid'; // Ładne ikonki

// Komponent przyjmuje te same propsy co stary modal + nowy prop `isVisible`
function ReservationSheet({ parking, onClose, onReservationSuccess, isVisible }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('sol');
  const [view, setView] = useState('details'); // 'details' -> 'success'
  const [showToast, setShowToast] = useState(false);

  // Ta funkcja to kopia logiki z Twojego ReservationModal.jsx
  const handleReservation = async () => {
    setIsLoading(true);
    console.log("Rezerwowanie miejsca:", parking.id, "za pomocą", paymentMethod);

    // Symulacja wywołania API (wstaw tu swoją prawdziwą logikę rezerwacji)
    try {
      // await reserveParking(parking.id, paymentMethod, duration);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Symulacja opóźnienia sieci

      // Sukces!
      setIsLoading(false);
      setView('success'); // Zmieniamy widok na sukces
      onReservationSuccess(parking); // Wywołujemy funkcję zwrotną
      
      // Automatycznie zamknij panel po 3 sekundach
      setTimeout(() => {
        onClose();
        setView('details'); // Zresetuj widok na następny raz
      }, 3000);

    } catch (error) {
      console.error("Błąd rezerwacji:", error);
      setIsLoading(false);
      setShowToast(true); // Pokaż tosta z błędem
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Efekt do resetowania widoku, gdy zmienia się parking
  useEffect(() => {
    if (isVisible) {
      setView('details'); // Zawsze pokazuj detale, gdy otwierasz nowy
    }
  }, [isVisible, parking]);

  // Klasy CSS do animacji wysuwania
  const sheetClasses = `
    fixed bottom-0 left-0 right-0 z-50
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    shadow-2xl rounded-t-2xl
    transition-transform duration-300 ease-in-out
    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
  `;

  // Klasy dla tła (backdrop)
  const backdropClasses = `
    fixed inset-0 bg-black z-40
    transition-opacity duration-300 ease-in-out
    ${isVisible ? 'opacity-50' : 'opacity-0 pointer-events-none'}
  `;

  if (!parking) return null;

  return (
    <>
      {/* Tło, które można kliknąć, by zamknąć panel */}
      <div className={backdropClasses} onClick={onClose} />
      
      {/* Właściwy panel */}
      <div className={sheetClasses}>
        <div className="p-6 max-w-lg mx-auto">
          
          {/* Mały uchwyt na górze (czysty "vibe") */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

          {/* Przycisk zamykania (X) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          {/* Widok: Sukces */}
          {view === 'success' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ParkingSuccessAnimation />
              <h2 className="text-2xl font-bold text-green-500 mt-4">
                {t('reservationSuccess.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{t('reservationSuccess.message')}</p>
            </div>
          ) : (
            
            /* Widok: Detale i rezerwacja */
            <>
              {/* Nagłówek */}
              <h2 className="text-2xl font-bold mb-2">{parking.name || t('reservationModal.title')}</h2>
              <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>{parking.address || 'Brak adresu'}</span>
              </div>
              
              {/* Kluczowe info */}
              <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <span className="text-lg font-medium">{t('reservationModal.price')}</span>
                <span className="text-2xl font-bold text-primary">
                  {parking.price_per_hour} {parking.currency} / {t('common.hour')}
                </span>
              </div>
              
              {/* TODO: Wstaw tu swój komponent do wyboru czasu, jeśli go masz */}
              {/* <TimeSelector /> */}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('reservationModal.paymentMethod')}
                </label>
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>

              {/* Główny przycisk CTA */}
              <Button
                onClick={handleReservation}
                disabled={isLoading}
                className="w-full text-lg py-3" // Duży i wyraźny
              >
                {isLoading ? <Spinner /> : t('reservationModal.reserveButton')}
              </Button>
            </>
          )}

        </div>
      </div>
      
      {/* Toast do pokazywania błędów (widziałem, że go masz) */}
      <Toast
        message={t('errors.reservationFailed')}
        type="error"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default ReservationSheet;