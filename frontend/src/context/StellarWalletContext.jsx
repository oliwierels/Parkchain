import React, { createContext, useContext, useState, useEffect } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';

const StellarWalletContext = createContext(null);

export function StellarWalletProvider({ children }) {
  const [kit, setKit] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize Stellar Wallet Kit
    const walletKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET, // Use TESTNET for development
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });

    setKit(walletKit);
    console.log('✅ Stellar Wallet Kit initialized');
  }, []);

  const connect = async () => {
    console.log('🔌 Connect button clicked, kit:', kit);

    if (!kit) {
      console.error('❌ Wallet kit not initialized yet');
      return;
    }

    try {
      console.log('📱 Opening wallet modal...');
      await kit.openModal({
        onWalletSelected: async (option) => {
          console.log('✅ Wallet selected:', option.id);
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          console.log('✅ Got address:', address);
          setPublicKey(address);
          setConnected(true);
        }
      });
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
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
