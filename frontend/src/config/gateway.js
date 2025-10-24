// Sanctum Gateway Configuration for Parkchain
// Gateway provides optimized transaction delivery for Solana with:
// - Auto compute unit calculation
// - Priority fee optimization
// - Multi-channel routing (RPC + Jito)
// - Automatic Jito tip refunds
// - Real-time observability

export const GATEWAY_CONFIG = {
  // Gateway API endpoint
  endpoint: import.meta.env.VITE_GATEWAY_ENDPOINT || 'https://gateway.sanctum.so/api',

  // API Key - Get from gateway.sanctum.so
  // For hackathon/demo: Contact Sanctum for API access
  apiKey: import.meta.env.VITE_GATEWAY_API_KEY || '',

  // Project ID for tracking
  projectId: import.meta.env.VITE_GATEWAY_PROJECT_ID || 'parkchain-dcp-marketplace',

  // Transaction delivery configuration
  delivery: {
    // Delivery methods: 'rpc', 'jito', 'triton', 'paladin'
    methods: ['rpc', 'jito'],

    // Round-robin weights for load balancing
    weights: {
      rpc: 0.7,   // 70% through RPC
      jito: 0.3   // 30% through Jito bundles
    },

    // Auto-refund Jito tips if transaction lands via RPC
    autoRefundJitoTips: true,

    // Timeout for transaction confirmation (ms)
    confirmationTimeout: 60000, // 60 seconds
  },

  // Optimization settings
  optimization: {
    // Auto-calculate compute units
    autoComputeUnits: true,

    // Auto-optimize priority fees based on network conditions
    autoPriorityFees: true,

    // Safety margin for compute units (10%)
    computeUnitMargin: 1.1,
  },

  // Observability settings
  observability: {
    // Enable detailed transaction logging
    enableLogging: true,

    // Log transaction stages
    logStages: ['optimize', 'sign', 'send', 'confirm'],

    // Send metrics to Gateway dashboard
    sendMetrics: true,
  },

  // Cost settings
  costs: {
    // Gateway fee per transaction (SOL)
    gatewayFee: 0.0001, // 0.0001 SOL per tx (10x cheaper than competitors!)

    // Show cost savings in UI
    showSavings: true,
  },

  // Network settings
  network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',

  // Feature flags
  features: {
    // Enable Gateway for all transactions
    enabled: true,

    // Fallback to standard sendTransaction if Gateway fails
    fallbackEnabled: true,

    // Show Gateway status in UI
    showStatusInUI: true,
  }
};

// Helper to check if Gateway is properly configured
export const isGatewayConfigured = () => {
  return GATEWAY_CONFIG.features.enabled && GATEWAY_CONFIG.endpoint;
};

// Helper to get Gateway status message
export const getGatewayStatus = () => {
  if (!GATEWAY_CONFIG.features.enabled) {
    return { enabled: false, message: 'Gateway disabled' };
  }

  if (!GATEWAY_CONFIG.apiKey) {
    return {
      enabled: false,
      message: 'Gateway API key not configured. Using standard Solana RPC.'
    };
  }

  return {
    enabled: true,
    message: `Gateway active - Routing: ${GATEWAY_CONFIG.delivery.methods.join(' + ')}`
  };
};

export default GATEWAY_CONFIG;
