import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID, ALBEDO_ID } from 'stellar-wallets-kit';
import stellarService from '../services/stellar/stellarService';

const StellarWalletContext = createContext(null);

export function StellarWalletProvider({ children }) {
  const [kit, setKit] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Initialize Stellar Wallets Kit on mount
  useEffect(() => {
    const walletKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET, // Change to PUBLIC for mainnet
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });

    setKit(walletKit);

    // Initialize Stellar service
    stellarService.initialize('testnet');

    console.log('🌟 Stellar Wallet Kit initialized');
  }, []);

  // Connect to wallet
  const connect = async (walletId = FREIGHTER_ID) => {
    if (!kit) {
      console.error('Wallet Kit not initialized');
      return;
    }

    try {
      setConnecting(true);

      kit.setWallet(walletId);
      const { address } = await kit.getAddress();

      setPublicKey(address);
      setWalletType(walletId);
      setConnected(true);

      console.log(`✅ Connected to ${walletId}:`, address);

      return { publicKey: address };
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    setPublicKey(null);
    setWalletType(null);
    setConnected(false);
    console.log('👋 Wallet disconnected');
  };

  // Sign transaction
  const signTransaction = async (xdr) => {
    if (!kit || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signedTxXdr } = await kit.signTransaction(xdr, {
        address: publicKey,
      });

      return signedTxXdr;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  };

  // Sign auth entry (for Soroban contract authorization)
  const signAuthEntry = async (entry, accountToSign) => {
    if (!kit || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const signed = await kit.signAuthEntry(entry, { accountToSign });
      return signed;
    } catch (error) {
      console.error('Error signing auth entry:', error);
      throw error;
    }
  };

  // Get account balance
  const getBalance = async () => {
    if (!publicKey) {
      return '0';
    }

    try {
      const balance = await stellarService.getBalance(publicKey);
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  };

  // Check if wallet is installed
  const isWalletInstalled = (walletId = FREIGHTER_ID) => {
    if (walletId === FREIGHTER_ID) {
      return typeof window.freighter !== 'undefined';
    }
    // Albedo doesn't require installation
    return walletId === ALBEDO_ID;
  };

  // Get supported wallets
  const getSupportedWallets = () => {
    return [
      {
        id: FREIGHTER_ID,
        name: 'Freighter',
        icon: '🚀',
        installUrl: 'https://www.freighter.app/',
        installed: typeof window.freighter !== 'undefined',
      },
      {
        id: ALBEDO_ID,
        name: 'Albedo',
        icon: '🌟',
        installUrl: 'https://albedo.link/',
        installed: true, // Albedo is always available (web-based)
      },
    ];
  };

  const value = useMemo(
    () => ({
      // Wallet state
      publicKey,
      walletType,
      connected,
      connecting,

      // Methods
      connect,
      disconnect,
      signTransaction,
      signAuthEntry,
      getBalance,
      isWalletInstalled,
      getSupportedWallets,

      // Stellar service for contract calls
      stellarService,
    }),
    [publicKey, walletType, connected, connecting, kit]
  );

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  );
}

// Custom hook to use Stellar wallet
export const useStellarWallet = () => {
  const context = useContext(StellarWalletContext);

  if (!context) {
    throw new Error('useStellarWallet must be used within StellarWalletProvider');
  }

  return context;
};

// Compatibility hook - maps to Solana-like API for easier migration
export const useWallet = () => {
  const stellar = useStellarWallet();

  return {
    publicKey: stellar.publicKey ? { toString: () => stellar.publicKey } : null,
    connected: stellar.connected,
    connecting: stellar.connecting,
    wallet: stellar.walletType ? { adapter: { name: stellar.walletType } } : null,
    connect: stellar.connect,
    disconnect: stellar.disconnect,
    signTransaction: stellar.signTransaction,
  };
};

export default StellarWalletContext;
