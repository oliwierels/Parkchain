import React, { createContext, useContext, useState, useEffect } from 'react';

const StellarWalletContext = createContext(null);

export function StellarWalletProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);

  useEffect(() => {
    // Check if Freighter is installed
    const checkFreighter = () => {
      const installed = typeof window.freighterApi !== 'undefined';
      setFreighterInstalled(installed);
      console.log('🔍 Freighter installed:', installed);
    };

    checkFreighter();
    // Recheck after a short delay (extension might load late)
    setTimeout(checkFreighter, 1000);
  }, []);

  const connect = async () => {
    if (isConnecting) {
      console.log('⏳ Already connecting...');
      return;
    }

    console.log('🔌 Connecting to Freighter wallet...');

    // Check if Freighter is installed
    if (typeof window.freighterApi === 'undefined') {
      const installUrl = 'https://www.freighter.app/';
      const shouldInstall = window.confirm(
        '🦊 Freighter wallet is not installed!\n\n' +
        'Freighter is required to connect your Stellar wallet.\n\n' +
        'Click OK to open the installation page.'
      );

      if (shouldInstall) {
        window.open(installUrl, '_blank');
      }
      return;
    }

    setIsConnecting(true);

    try {
      console.log('📱 Requesting Freighter access...');

      // Request access to Freighter
      const isAllowed = await window.freighterApi.isAllowed();

      if (!isAllowed) {
        console.log('⚠️ Requesting permission...');
        await window.freighterApi.setAllowed();
      }

      // Get public key
      const network = 'PUBLIC'; // or 'TESTNET'
      const publicKeyResponse = await window.freighterApi.getPublicKey();

      console.log('✅ Connected! Public key:', publicKeyResponse);
      setPublicKey(publicKeyResponse);
      setConnected(true);
      setIsConnecting(false);

    } catch (error) {
      console.error('❌ Failed to connect:', error);

      let errorMessage = 'Failed to connect to Freighter wallet.';

      if (error.message.includes('User declined')) {
        errorMessage = 'You declined the connection request. Please try again and approve the connection.';
      } else if (error.message.includes('locked')) {
        errorMessage = 'Freighter wallet is locked. Please unlock it and try again.';
      } else {
        errorMessage = `Connection error: ${error.message}`;
      }

      alert(errorMessage);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setConnected(false);
    console.log('🔌 Disconnected from Freighter');
  };

  const value = {
    kit: null, // For compatibility
    publicKey,
    connected,
    connect,
    disconnect,
    isConnecting,
    freighterInstalled,
  };

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  );
}

export const useStellar = () => {
  const context = useContext(StellarWalletContext);
  if (!context) {
    throw new Error('useStellar must be used within StellarWalletProvider');
  }
  return context;
};
