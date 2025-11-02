import { useState } from 'react';
import { useStellarWallet } from '../context/StellarWalletContext';

/**
 * Payment Method Selector for Parkchain Reservations
 * Shows different payment options with Stellar as the recommended method
 *
 * Payment Methods:
 * 1. Stellar (XLM) - Fastest, cheapest, <1% failure rate ⚡ RECOMMENDED
 * 2. Credit Card - Traditional, 2.9% + 0.30 PLN fee
 * 3. Pay Later - For registered users only
 */
function PaymentMethodSelector({ amount, onSelect, selectedMethod }) {
  const { connected, publicKey, connect, getSupportedWallets } = useStellarWallet();

  // Calculate fees for different payment methods
  const calculateFees = () => {
    const amountPLN = amount; // Amount in PLN

    // Convert PLN to XLM (rough estimate: 1 XLM = ~2 PLN)
    const amountXLM = amountPLN / 2;

    return {
      stellar: {
        baseCost: amountXLM,
        transactionFee: 0.00001, // Stellar fee: 0.00001 XLM
        totalXLM: amountXLM + 0.00001,
        totalPLN: (amountXLM + 0.00001) * 2,
        savingsVsCard: (amountPLN * 0.029) - (0.00001 * 2), // Save vs card fees
        successRate: 99,
        confirmTime: '2-5s',
        features: [
          'Stellar network - ultra-low fees',
          '<1% failure rate',
          '99%+ success rate',
          'Instant confirmation',
          '98% cheaper than credit cards'
        ]
      },
      card: {
        baseCost: amountPLN,
        transactionFee: amountPLN * 0.029 + 0.30, // 2.9% + 0.30 PLN
        totalPLN: amountPLN + (amountPLN * 0.029 + 0.30),
        successRate: 98,
        confirmTime: '1-2 min',
        features: [
          'Traditional payment',
          'Credit/Debit cards',
          'High fees (2.9% + 0.30 PLN)',
          'Slower processing'
        ]
      },
      later: {
        baseCost: amountPLN,
        transactionFee: 0,
        totalPLN: amountPLN,
        successRate: 100,
        confirmTime: 'Instant',
        features: [
          'Pay after parking',
          'No upfront payment',
          'Requires verified account',
          'Auto-charge after session'
        ]
      }
    };
  };

  const fees = calculateFees();

  const paymentMethods = [
    {
      id: 'gateway',
      name: 'Sanctum Gateway',
      icon: '⚡',
      badge: 'POLECANE',
      badgeColor: 'bg-green-500',
      description: 'Najszybsza i najtańsza opcja',
      provider: 'Solana + Gateway',
      fee: fees.gateway.transactionFee,
      total: fees.gateway.totalPLN,
      savings: fees.gateway.savingsVsStandard,
      successRate: fees.gateway.successRate,
      confirmTime: fees.gateway.confirmTime,
      features: fees.gateway.features,
      color: 'border-green-500 bg-green-50',
      disabled: !connected,
      requiresWallet: true
    },
    {
      id: 'solana',
      name: 'Standard Solana',
      icon: '◎',
      badge: null,
      description: 'Standardowa transakcja Solana',
      provider: 'Solana RPC',
      fee: fees.solana.transactionFee * 600,
      total: fees.solana.totalPLN,
      successRate: fees.solana.successRate,
      confirmTime: fees.solana.confirmTime,
      features: fees.solana.features,
      color: 'border-blue-500 bg-blue-50',
      disabled: !connected,
      requiresWallet: true
    },
    {
      id: 'card',
      name: 'Karta płatnicza',
      icon: '💳',
      badge: null,
      description: 'Visa, Mastercard, Apple Pay',
      provider: 'Stripe',
      fee: fees.card.transactionFee,
      total: fees.card.totalPLN,
      successRate: fees.card.successRate,
      confirmTime: fees.card.confirmTime,
      features: fees.card.features,
      color: 'border-purple-500 bg-purple-50',
      disabled: false,
      requiresWallet: false
    },
    {
      id: 'later',
      name: 'Zapłać później',
      icon: '🕐',
      badge: null,
      description: 'Płatność po zakończeniu parkowania',
      provider: 'Parkchain',
      fee: 0,
      total: fees.later.totalPLN,
      successRate: fees.later.successRate,
      confirmTime: fees.later.confirmTime,
      features: fees.later.features,
      color: 'border-gray-500 bg-gray-50',
      disabled: false, // Could check if user is verified
      requiresWallet: false
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Wybierz metodę płatności
        </h3>
        <p className="text-sm text-gray-600">
          Cena rezerwacji: <span className="font-bold text-gray-900">{amount.toFixed(2)} PLN</span>
        </p>
      </div>

      {/* Wallet Connection Banner (if not connected) */}
      {!connected && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Połącz portfel Solana aby odblokowaować najlepsze opcje płatności!
              </p>
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-sm !py-2 !px-4" />
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => !method.disabled && onSelect(method.id)}
            disabled={method.disabled}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all
              ${method.disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-100'
                : selectedMethod === method.id
                  ? `${method.color} ring-4 ring-offset-2 ring-blue-400`
                  : `${method.color} hover:shadow-lg cursor-pointer`
              }
            `}
          >
            {/* Badge (Recommended, etc) */}
            {method.badge && (
              <div className="absolute -top-2 -right-2">
                <span className={`
                  ${method.badgeColor} text-white text-xs font-bold
                  px-3 py-1 rounded-full shadow-lg
                `}>
                  {method.badge}
                </span>
              </div>
            )}

            {/* Selected Indicator */}
            {selectedMethod === method.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
            )}

            {/* Method Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">{method.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-base mb-1">
                  {method.name}
                </h4>
                <p className="text-xs text-gray-600">
                  {method.description}
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">Kwota bazowa:</span>
                <span className="text-sm font-medium text-gray-900">
                  {amount.toFixed(2)} PLN
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <span className="text-xs text-gray-600">Opłata transakcyjna:</span>
                <span className="text-sm font-medium text-gray-900">
                  {method.fee.toFixed(2)} {method.id === 'gateway' || method.id === 'solana' ? 'PLN' : 'PLN'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Razem:</span>
                <span className="text-lg font-bold text-gray-900">
                  {method.total.toFixed(2)} PLN
                </span>
              </div>
            </div>

            {/* Savings Badge for Gateway */}
            {method.id === 'gateway' && method.savings > 0 && (
              <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-2 rounded-lg mb-3 text-center">
                💰 Oszczędzasz {method.savings.toFixed(2)} PLN vs Standard Solana!
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Sukces:</div>
                <div className={`text-sm font-bold ${
                  method.successRate >= 99 ? 'text-green-600' :
                  method.successRate >= 95 ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {method.successRate}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Czas:</div>
                <div className="text-sm font-bold text-gray-900">
                  {method.confirmTime}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1">
              {method.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5">•</span>
                  <span className="text-xs text-gray-700 leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Requires Wallet Message */}
            {method.requiresWallet && method.disabled && (
              <div className="mt-3 text-xs text-gray-500 text-center">
                Wymagane połączenie portfela Solana
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Gateway Benefits Banner */}
      {selectedMethod === 'gateway' && connected && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">
                Dlaczego Gateway?
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    <strong>99%+ sukcesu:</strong> Multi-channel routing przez RPC + Jito bundles
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    <strong>Oszczędności:</strong> Auto-zwrot Jito tips jeśli RPC sukces
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    <strong>Najszybsze:</strong> 3-5 sekund potwierdzenia vs 8-15s standard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>
                    <strong>10x taniej:</strong> 0.0001 SOL fee vs 0.001 SOL standardowo
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-gray-900 mb-3 text-center">
          Porównanie metod płatności
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 px-2 font-bold text-gray-700">Metoda</th>
                <th className="text-center py-2 px-2 font-bold text-gray-700">Opłata</th>
                <th className="text-center py-2 px-2 font-bold text-gray-700">Sukces</th>
                <th className="text-center py-2 px-2 font-bold text-gray-700">Czas</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((method, idx) => (
                <tr
                  key={method.id}
                  className={`
                    ${idx < paymentMethods.length - 1 ? 'border-b border-gray-200' : ''}
                    ${selectedMethod === method.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span>{method.icon}</span>
                      <span className="font-medium text-gray-900">{method.name}</span>
                      {method.id === 'gateway' && (
                        <span className="text-green-600 text-lg">★</span>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-2 px-2 font-medium text-gray-900">
                    {method.fee.toFixed(2)} PLN
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={`
                      font-bold
                      ${method.successRate >= 99 ? 'text-green-600' :
                        method.successRate >= 95 ? 'text-blue-600' :
                        'text-yellow-600'}
                    `}>
                      {method.successRate}%
                    </span>
                  </td>
                  <td className="text-center py-2 px-2 text-gray-700">
                    {method.confirmTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          ★ Gateway to najlepsza opcja - najszybsza, najtańsza i najbardziej niezawodna!
        </p>
      </div>

      {/* Selected Method Info */}
      {selectedMethod && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-900">
            Wybrano: <strong className="font-bold">
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
