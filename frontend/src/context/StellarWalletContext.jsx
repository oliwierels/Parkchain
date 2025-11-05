import React, { createContext, useContext, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';

const StellarWalletContext = createContext(null);

export function StellarWalletProvider({ children }) {
  const [kit] = useState(() => {
    // Initialize kit immediately in state
    console.log('🚀 Initializing Stellar Wallet Kit...');
    const walletKit = new StellarWalletsKit({
      network: WalletNetwork.PUBLIC, // Use PUBLIC network (Mainnet) - Freighter default
      modules: allowAllModules(), // Allow all wallet types
    });
    console.log('✅ Stellar Wallet Kit initialized:', walletKit);
    console.log('📡 Network: PUBLIC (Mainnet)');
    return walletKit;
  });

  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    if (isConnecting) {
      console.log('⏳ Already connecting, please wait...');
      return;
    }

    console.log('🔌 Connect button clicked');
    console.log('🔍 Kit available:', !!kit);

    if (!kit) {
      console.error('❌ Wallet kit is null!');
      alert('Wallet kit not initialized. Please refresh the page.');
      return;
    }

    setIsConnecting(true);

    try {
      // Close modal first if it's somehow already open
      try {
        await kit.closeModal();
        console.log('🔄 Closed any existing modal');
      } catch (e) {
        // Ignore errors from closing non-existent modal
      }

      console.log('📱 Calling kit.openModal()...');

      await kit.openModal({
        onWalletSelected: async (option) => {
          console.log('✅ Wallet selected:', option);
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            console.log('✅ Got address:', address);
            setPublicKey(address);
            setConnected(true);
            setIsConnecting(false);
          } catch (error) {
            console.error('❌ Error getting address:', error);

            // Better error messages for common issues
            let errorMsg = error.message;
            if (errorMsg.includes('not available') || errorMsg.includes('Not installed')) {
              errorMsg = `
                Freighter wallet is not installed or not available.

                Please:
                1. Install Freighter: https://www.freighter.app/
                2. Create/import a wallet
                3. Make sure Freighter is unlocked
                4. Refresh this page and try again
              `;
            }

            alert(errorMsg);
            setIsConnecting(false);
          }
        },
        onClosed: () => {
          console.log('🚪 Modal closed by user');
          setIsConnecting(false);
        }
      });

      console.log('📱 Modal opened successfully');
    } catch (error) {
      console.error('❌ Error opening wallet modal:', error);

      // Check if it's a "not installed" error
      if (error.message && error.message.toLowerCase().includes('freighter')) {
        alert(`
          Freighter wallet extension is required but not found.

          Install it from: https://www.freighter.app/

          Then refresh this page.
        `);
      } else {
        alert('Failed to open wallet selector: ' + error.message);
      }

      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setConnected(false);
    console.log('🔌 Wallet disconnected');
  };

  const value = {
    kit,
    publicKey,
    connected,
    connect,
    disconnect,
    isConnecting,
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
