const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const CONFIG = {
    // Replace 'https://YOUR_HF_SPACE_URL' with your actual deployed backend URL (e.g., https://huggingface.co    // If localhost, use local backend. Otherwise, use the deployed Hugging Face URL.
    // User will need to replace 'YOUR_HF_SPACE_URL' with their actual URL after deployment.
    API_BASE_URL: isLocalhost
        ? 'http://localhost:8001'
        : 'https://rakshitjan-promotional-backend.hf.space',
    POLLING_INTERVAL: 30000, // 30 seconds
    CURRENCY_SYMBOLS: {
        LP: 'LP',
        RP: 'RP',
        BONUS_BALANCE: '$',
        TICKETS: '🎫'
    }
};

export const ROUTES = {
    DASHBOARD: 'dashboard',
    PLAYERS: 'players',
    RULES: 'rules',
    TIERS: 'tiers',
    WALLET: 'wallet',
    ANALYTICS: 'analytics',
    REDEMPTION: 'redemption',
    PROMOTIONS: 'promotions'
};
