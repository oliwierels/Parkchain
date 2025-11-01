/**
 * Stellar Wallet Provider
 * Integration with Freighter, Albedo, and other Stellar wallets
 *
 * With Scaffold Stellar, Wallet Kit integration is built-in!
 */

import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID, ALBEDO_ID } from 'stellar-wallets-kit';

class StellarWalletProvider {
  constructor() {
    this.kit = null;
    this.publicKey = null;
    this.walletType = null;
  }

  /**
   * Initialize Wallet Kit
   */
  initialize(network = WalletNetwork.TESTNET) {
    this.kit = new StellarWalletsKit({
      network,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });

    console.log('🔐 Stellar Wallet Kit initialized');
  }

  /**
   * Connect to wallet
   */
  async connect(walletId = FREIGHTER_ID) {
    try {
      if (!this.kit) {
        this.initialize();
      }

      this.kit.setWallet(walletId);
      const { address } = await this.kit.getAddress();

      this.publicKey = address;
      this.walletType = walletId;

      console.log(`✅ Connected to ${walletId}:`, address);

      return {
        publicKey: address,
        walletType: walletId,
      };
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    this.publicKey = null;
    this.walletType = null;
    console.log('👋 Wallet disconnected');
  }

  /**
   * Sign transaction
   */
  async signTransaction(xdr) {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const { signedTxXdr } = await this.kit.signTransaction(xdr, {
        address: this.publicKey,
      });

      return signedTxXdr;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  /**
   * Sign auth entry (for contract auth)
   */
  async signAuthEntry(entry, accountToSign) {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const signed = await this.kit.signAuthEntry(entry, { accountToSign });
      return signed;
    } catch (error) {
      console.error('Error signing auth entry:', error);
      throw error;
    }
  }

  /**
   * Get connected wallet info
   */
  getWalletInfo() {
    return {
      publicKey: this.publicKey,
      walletType: this.walletType,
      isConnected: !!this.publicKey,
    };
  }

  /**
   * Check if wallet is installed
   */
  async isWalletInstalled(walletId = FREIGHTER_ID) {
    if (walletId === FREIGHTER_ID) {
      return typeof window.freighter !== 'undefined';
    }
    // Albedo doesn't require installation
    return walletId === ALBEDO_ID;
  }

  /**
   * Get supported wallets
   */
  getSupportedWallets() {
    return [
      {
        id: FREIGHTER_ID,
        name: 'Freighter',
        icon: '🚀',
        installUrl: 'https://www.freighter.app/',
      },
      {
        id: ALBEDO_ID,
        name: 'Albedo',
        icon: '🌟',
        installUrl: 'https://albedo.link/',
      },
    ];
  }
}

// Singleton instance
const walletProvider = new StellarWalletProvider();

export default walletProvider;
export { FREIGHTER_ID, ALBEDO_ID, WalletNetwork };
