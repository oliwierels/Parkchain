/**
 * Stellar Service Layer for Parkchain
 * Handles all Stellar blockchain interactions
 *
 * With Scaffold Stellar, this would be auto-generated!
 */

import * as StellarSdk from '@stellar/stellar-sdk';

class StellarService {
  constructor() {
    this.server = null;
    this.network = null;
    this.networkPassphrase = null;
    this.contracts = {
      dcpToken: null,
      parkingAsset: null,
      marketplace: null,
    };
  }

  /**
   * Initialize Stellar connection
   * @param {string} network - 'testnet' or 'mainnet'
   */
  async initialize(network = 'testnet') {
    this.network = network;

    if (network === 'testnet') {
      this.server = new StellarSdk.SorobanRpc.Server(
        'https://soroban-testnet.stellar.org'
      );
      this.networkPassphrase = StellarSdk.Networks.TESTNET;
    } else {
      this.server = new StellarSdk.SorobanRpc.Server(
        'https://soroban-mainnet.stellar.org'
      );
      this.networkPassphrase = StellarSdk.Networks.PUBLIC;
    }

    console.log(`🌟 Stellar Service initialized on ${network}`);
  }

  /**
   * Set contract addresses
   * With Scaffold Stellar, these would be in auto-generated config
   */
  setContracts({ dcpToken, parkingAsset, marketplace }) {
    this.contracts = {
      dcpToken: dcpToken || this.contracts.dcpToken,
      parkingAsset: parkingAsset || this.contracts.parkingAsset,
      marketplace: marketplace || this.contracts.marketplace,
    };
  }

  /**
   * Get account details
   */
  async getAccount(publicKey) {
    try {
      const account = await this.server.getAccount(publicKey);
      return account;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey) {
    try {
      const account = await this.getAccount(publicKey);
      const xlmBalance = account.balances.find(
        (balance) => balance.asset_type === 'native'
      );
      return xlmBalance ? xlmBalance.balance : '0';
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  /**
   * Build and submit transaction
   */
  async buildAndSubmitTx(operation, sourcePublicKey, signTransaction) {
    try {
      const account = await this.server.getAccount(sourcePublicKey);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(180)
        .build();

      // Sign transaction with wallet
      const signedTx = await signTransaction(transaction.toXDR());
      const tx = StellarSdk.TransactionBuilder.fromXDR(
        signedTx,
        this.networkPassphrase
      );

      // Submit transaction
      const result = await this.server.sendTransaction(tx);

      // Wait for confirmation
      if (result.status === 'PENDING') {
        let txResponse = await this.server.getTransaction(result.hash);
        while (txResponse.status === 'NOT_FOUND') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          txResponse = await this.server.getTransaction(result.hash);
        }

        if (txResponse.status === 'SUCCESS') {
          return { success: true, hash: result.hash, result: txResponse };
        } else {
          throw new Error(`Transaction failed: ${txResponse.status}`);
        }
      }

      return { success: true, hash: result.hash, result };
    } catch (error) {
      console.error('Error building/submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Invoke contract function
   * With Scaffold Stellar, you'd use auto-generated clients instead!
   *
   * Example with Scaffold:
   *   const client = new ParkingAssetClient({ publicKey, ... });
   *   await client.initializeAsset({ ... });
   */
  async invokeContract(contractAddress, functionName, params, sourcePublicKey, signTransaction) {
    try {
      const contract = new StellarSdk.Contract(contractAddress);

      // Build contract invocation
      const operation = contract.call(functionName, ...params);

      const result = await this.buildAndSubmitTx(
        operation,
        sourcePublicKey,
        signTransaction
      );

      return result;
    } catch (error) {
      console.error(`Error invoking ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get DCP token balance
   */
  async getDCPBalance(userAddress) {
    if (!this.contracts.dcpToken) {
      throw new Error('DCP Token contract not configured');
    }

    try {
      // In production with Scaffold Stellar:
      // const client = new DCPTokenClient({ ... });
      // return await client.balance({ address: userAddress });

      const result = await this.invokeContract(
        this.contracts.dcpToken,
        'balance',
        [StellarSdk.Address.fromString(userAddress).toScVal()],
        userAddress,
        null // Read-only, no signature needed
      );

      return result;
    } catch (error) {
      console.error('Error fetching DCP balance:', error);
      return 0;
    }
  }

  /**
   * Mint DCP tokens (admin only)
   * 1 DCP per kWh charged
   */
  async mintDCP(toAddress, kWhCharged, adminPublicKey, signTransaction) {
    if (!this.contracts.dcpToken) {
      throw new Error('DCP Token contract not configured');
    }

    try {
      const amount = BigInt(kWhCharged) * BigInt(10_000_000); // 7 decimals

      // With Scaffold Stellar:
      // const client = new DCPTokenClient({ publicKey: adminPublicKey, ... });
      // return await client.mint({ to: toAddress, amount });

      const result = await this.invokeContract(
        this.contracts.dcpToken,
        'mint',
        [
          StellarSdk.Address.fromString(toAddress).toScVal(),
          StellarSdk.nativeToScVal(amount, { type: 'i128' }),
        ],
        adminPublicKey,
        signTransaction
      );

      return result;
    } catch (error) {
      console.error('Error minting DCP:', error);
      throw error;
    }
  }

  /**
   * Initialize parking asset
   */
  async initializeParkingAsset(
    {
      tokenAddress,
      parkingLotId,
      spotNumber,
      assetType,
      totalSupply,
      estimatedValueUSDC,
      annualRevenueUSDC,
      revenueSharePercentage,
    },
    operatorPublicKey,
    signTransaction
  ) {
    if (!this.contracts.parkingAsset) {
      throw new Error('Parking Asset contract not configured');
    }

    try {
      // With Scaffold Stellar, this would be:
      // const client = new ParkingAssetClient({ publicKey: operatorPublicKey, ... });
      // return await client.initializeAsset({ ... all params ... });

      const params = [
        StellarSdk.Address.fromString(tokenAddress).toScVal(),
        StellarSdk.Address.fromString(operatorPublicKey).toScVal(),
        StellarSdk.nativeToScVal(parkingLotId, { type: 'u64' }),
        StellarSdk.nativeToScVal(spotNumber, { type: 'string' }),
        StellarSdk.nativeToScVal(assetType, { type: 'u32' }),
        StellarSdk.nativeToScVal(totalSupply, { type: 'i128' }),
        StellarSdk.nativeToScVal(estimatedValueUSDC, { type: 'i128' }),
        StellarSdk.nativeToScVal(annualRevenueUSDC, { type: 'i128' }),
        StellarSdk.nativeToScVal(revenueSharePercentage, { type: 'u32' }),
      ];

      const result = await this.invokeContract(
        this.contracts.parkingAsset,
        'initialize_asset',
        params,
        operatorPublicKey,
        signTransaction
      );

      return result;
    } catch (error) {
      console.error('Error initializing parking asset:', error);
      throw error;
    }
  }

  /**
   * Create marketplace listing
   */
  async createListing(
    {
      assetContract,
      assetId,
      listingType,
      tokenAmount,
      pricePerTokenUSDC,
      paymentMethods,
      minimumPurchaseUSDC,
      kybRequired,
      expiresInSeconds,
    },
    sellerPublicKey,
    signTransaction
  ) {
    if (!this.contracts.marketplace) {
      throw new Error('Marketplace contract not configured');
    }

    try {
      // With Scaffold Stellar:
      // const client = new MarketplaceClient({ publicKey: sellerPublicKey, ... });
      // return await client.createListing({ ... });

      const result = await this.invokeContract(
        this.contracts.marketplace,
        'create_listing',
        [
          StellarSdk.Address.fromString(assetContract).toScVal(),
          StellarSdk.nativeToScVal(assetId, { type: 'u64' }),
          StellarSdk.Address.fromString(sellerPublicKey).toScVal(),
          StellarSdk.nativeToScVal(listingType, { type: 'u32' }),
          StellarSdk.nativeToScVal(tokenAmount, { type: 'i128' }),
          StellarSdk.nativeToScVal(pricePerTokenUSDC, { type: 'i128' }),
          StellarSdk.nativeToScVal(paymentMethods, { type: 'vec' }),
          StellarSdk.nativeToScVal(minimumPurchaseUSDC, { type: 'i128' }),
          StellarSdk.nativeToScVal(kybRequired, { type: 'bool' }),
          StellarSdk.nativeToScVal(expiresInSeconds, { type: 'u64' }),
        ],
        sellerPublicKey,
        signTransaction
      );

      return result;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Buy parking asset
   */
  async buyAsset(
    { listingId, tokenAmount, paymentToken, isKybVerified },
    buyerPublicKey,
    signTransaction
  ) {
    if (!this.contracts.marketplace) {
      throw new Error('Marketplace contract not configured');
    }

    try {
      const result = await this.invokeContract(
        this.contracts.marketplace,
        'buy_asset',
        [
          StellarSdk.nativeToScVal(listingId, { type: 'u64' }),
          StellarSdk.Address.fromString(buyerPublicKey).toScVal(),
          StellarSdk.nativeToScVal(tokenAmount, { type: 'i128' }),
          StellarSdk.Address.fromString(paymentToken).toScVal(),
          StellarSdk.nativeToScVal(isKybVerified, { type: 'bool' }),
        ],
        buyerPublicKey,
        signTransaction
      );

      return result;
    } catch (error) {
      console.error('Error buying asset:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateFee() {
    // Stellar fees are very low and predictable
    // Base fee is 100 stroops (0.00001 XLM)
    return {
      fee: '0.00001',
      currency: 'XLM',
      usd: 0.0000012, // Approximate
    };
  }
}

// Singleton instance
const stellarService = new StellarService();

export default stellarService;
