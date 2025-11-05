import React, { createContext, useContext, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';

const StellarWalletContext = createContext(null);

export function StellarWalletProvider({ children }) {
  const [kit] = useState(() => {
    // Initialize kit immediately in state
    console.log('🚀 Initializing Stellar Wallet Kit...');
    const walletKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
    console.log('✅ Stellar Wallet Kit initialized:', walletKit);
    return walletKit;
  });

  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = async () => {
    console.log('🔌 Connect button clicked');
    console.log('🔍 Kit available:', !!kit);

    if (!kit) {
      console.error('❌ Wallet kit is null!');
      alert('Wallet kit not initialized. Please refresh the page.');
      return;
    }

    try {
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
          } catch (error) {
            console.error('❌ Error getting address:', error);
            alert('Failed to get wallet address: ' + error.message);
          }
        }
      });

      console.log('📱 Modal opened successfully');
    } catch (error) {
      console.error('❌ Error opening wallet modal:', error);
      alert('Failed to open wallet selector: ' + error.message);
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
