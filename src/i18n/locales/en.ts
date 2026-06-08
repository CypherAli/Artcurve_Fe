export interface Translations {
  nav: {
    marketplace: string; trade: string; live: string
    guild: string; vault: string; studio: string
  }
  header: {
    notifications: string; markAllRead: string; allCaughtUp: string
    viewAllActivity: string; clearAll: string; all: string
    unread: string; signOut: string; connectWallet: string
  }
  lang: { label: string; search: string }
  common: {
    viewDetailReviews: string; buy: string; sell: string; collect: string
    noReviewsYet: string; loading: string; error: string; search: string
    noResults: string; live: string; back: string; cancel: string; confirm: string
  }
  marketplace: {
    title: string; subtitle: string; totalVolume: string; listings: string
    trades24h: string; all: string; search: string; race: string
    marketCap: string; change24h: string; change7d: string; liveActivity: string
  }
  trade: {
    markets: string; search: string; change24h: string; vol24h: string
    high24h: string; low24h: string; holders: string; progress: string
    recentTrades: string; orderBook: string; time: string; side: string
    price: string; size: string; sizeEth: string; total: string; wallet: string
    youPay: string; youReceive: string; estimate: string
    impact: string; minOut: string; graduationWarning: string
    youSell: string; slippage: string; confirming: string; orderExecuted: string
    noResults: string; priceEth: string; bal: string; max: string
  }
  guild: {
    joined: string; guilds: string; discover: string; myGuilds: string
    statsFormat: string; createGuild: string; createModalTitle: string
    guildNameLabel: string; guildNamePlaceholder: string
    descriptionLabel: string; descriptionPlaceholder: string
    focusLabel: string; createButton: string
    activity: string; chat: string; members: string; holdings: string
    leave: string; joinGuild: string
    reply: string; chatPlaceholder: string
    collectiveHoldings: string; positions: string
    noHoldingsData: string; moreMembers: string; tokens: string; qty: string; pctCollective: string
  }
  live: {
    home: string; live: string; artists: string; you: string
    all: string; following: string; videos: string
    painting: string; drawing: string; digital: string
    sculpture: string; mixedMedia: string; trending: string
    watching: string; saveToPlaylist: string; share: string
    report: string; moreOptions: string
    goLive: string; streamTitleLabel: string; streamTitlePlaceholder: string
    categoryLabel: string; starting: string; startStreaming: string
    goLiveButton: string; noContent: string
  }
  studio: {
    createArtwork: string; uploadPrompt: string; uploadHint: string
    artworkTitleLabel: string; artworkTitlePlaceholder: string
    tickerLabel: string; tickerHint: string; categoryLabel: string
    descriptionLabel: string; descriptionPlaceholder: string
    bondingCurveTypeLabel: string; totalSupplyLabel: string
    initPriceLabel: string; creatorRoyaltyLabel: string
    aiModeration: string; launchArtwork: string
    previewLabel: string; curveLabel: string; initPriceCard: string
    supplyCard: string; royaltyCard: string
    bondingCurveChart: string; priceVsSupply: string; supply80: string
    targetPrice: string; at80Supply: string; ethToGrad: string
    graduationThreshold: string; estGasCost: string; deployDesc: string
    launchChecklist: string; stepUpload: string; stepTitle: string
    stepTicker: string; stepCategory: string; stepCurve: string
    stepAiCheck: string; stepWallet: string; stepGas: string; stepDeploy: string
    awaitingSubmission: string; aiCheckDescription: string; analyzing: string
    approved: string; approvedDetails: string; rejected: string; rejectedMessage: string
    breadcrumbStudio: string; breadcrumbNew: string
    connected: string; notConnected: string
  }
  vault: {
    portfolioValue: string; timeframe7d: string; timeframe30d: string; timeframe90d: string
    allocation: string; total: string
    portfolioValueStat: string; unrealizedPnl: string; realizedPnl: string; ethBalance: string
    myHoldings: string; txHistory: string
    asset: string; qty: string; avgBuy: string; current: string
    value: string; pnl: string; chgPct: string
    date: string; side: string; token: string; ethSpent: string
    buy: string; sell: string; realizedPnlClosed: string; tradeLink: string; noResults: string
  }
  settings: {
    title: string; accountSettings: string; accountSettingsDesc: string
    profileSection: string; usernameLabel: string; usernamePlaceholder: string
    bioLabel: string; bioPlaceholder: string
    saving: string; saved: string; saveChanges: string
    notificationsSection: string
    tradeAlerts: string; tradeAlertsDesc: string
    newFollowers: string; newFollowersDesc: string
    priceMilestones: string; priceMilestonesDesc: string
    securitySection: string; authMethod: string; authMethodDesc: string
    session: string; sessionDesc: string; active: string
    dangerZone: string; signOut: string; signOutDesc: string
  }
  wallet: {
    signInTitle: string; signInDesc: string; title: string
    yourWallet: string; walletDesc: string; verified: string; anonymous: string
    signOut: string; connectedWallet: string; accountAddress: string
    smartAccount: string; copy: string; copied: string; explorer: string
    ethBalance: string; emptyWallet: string; walletNotConnected: string
    portfolio: string; noPositions: string; holdingsCount: string; holdingsCountPlural: string
    network: string; authMethod: string
    portfolioHoldings: string; totalPnl: string
    linkWalletTitle: string; linkWalletDesc: string
    noWalletsDetected: string; noWalletsHint: string; getMetaMask: string
    showLess: string; showMore: string; detected: string
    securitySection: string; signInMethod: string; walletVerification: string
    onChainWallet: string; verifiedViaSiwe: string; notVerified: string
    accountRole: string; artist: string; admin: string; collector: string; userId: string
  }
  artwork: {
    backToMarketplace: string; marketCap: string; change24h: string
    holders: string; volume24h: string; completion: string; phase: string
    graduated: string; bondingCurve: string; priceVsSupply: string; now: string
    buy: string; collectorVoices: string
    poor: string; fair: string; good: string; great: string; exceptional: string
    sharePerspective: string; posting: string; post: string
    connectToShare: string; connect: string; noPerspectives: string
    artworkNotFound: string; topHolders: string
  }
  error: {
    systemError: string; somethingWentWrong: string; tryAgain: string
  }
  notFound: {
    label: string; description: string; returnToMarket: string
  }
  auth: { signingIn: string }
}

const en: Translations = {
  nav: {
    marketplace: 'Marketplace', trade: 'Trade', live: 'Live',
    guild: 'Guild', vault: 'Vault', studio: 'Studio',
  },
  header: {
    notifications: 'Notifications', markAllRead: 'Mark all read',
    allCaughtUp: 'All caught up', viewAllActivity: 'View all activity',
    clearAll: 'Clear all', all: 'All', unread: 'Unread',
    signOut: 'Sign out', connectWallet: 'Connect Wallet',
  },
  lang: { label: 'Language', search: 'Search language…' },
  common: {
    viewDetailReviews: 'View Detail & Reviews', buy: 'Buy', sell: 'Sell',
    collect: 'Collect', noReviewsYet: 'No reviews yet',
    loading: 'Loading…', error: 'Something went wrong',
    search: 'Search…', noResults: 'No results', live: 'Live',
    back: 'Back', cancel: 'Cancel', confirm: 'Confirm',
  },
  marketplace: {
    title: 'Live Marketplace', subtitle: 'Trade unique artworks on the bonding curve.',
    totalVolume: 'Total Volume', listings: 'Live Listings', trades24h: '24H Trades',
    all: 'All', search: 'Search…', race: 'Race', marketCap: 'Market Cap',
    change24h: '24h Change', change7d: '7d Change', liveActivity: 'Live Activity',
  },
  trade: {
    markets: 'Markets', search: 'Search…', change24h: '24H Change',
    vol24h: '24H Vol', high24h: '24H High', low24h: '24H Low',
    holders: 'Holders', progress: 'Progress',
    recentTrades: 'Recent Trades', orderBook: 'Order Book',
    time: 'Time', side: 'Side', price: 'Price', size: 'Size',
    sizeEth: 'Size (ETH)', total: 'Total', wallet: 'Wallet',
    priceEth: 'Price (ETH)', bal: 'Bal', max: 'MAX',
    youPay: 'You Pay', youReceive: 'You Receive', estimate: 'estimate',
    impact: 'Impact', minOut: 'Min. Out',
    graduationWarning: 'This trade would graduate the artwork to DEX',
    youSell: 'You Sell', slippage: 'Slippage',
    confirming: 'Confirming…', orderExecuted: 'Order Executed', noResults: 'No results',
  },
  guild: {
    joined: 'Joined', guilds: 'Guilds', discover: 'Discover', myGuilds: 'My Guilds',
    statsFormat: '{count} guilds · {members} members',
    createGuild: '+ Create Guild', createModalTitle: 'Create a Guild',
    guildNameLabel: 'Guild Name', guildNamePlaceholder: 'e.g. The Nocturne Society',
    descriptionLabel: 'Description', descriptionPlaceholder: 'What does your guild collect and celebrate?',
    focusLabel: 'Focus', createButton: '✦ Create Guild',
    activity: 'Activity', chat: 'Chat', members: 'Members', holdings: 'Holdings',
    leave: 'Leave', joinGuild: 'Join Guild',
    reply: 'Reply', chatPlaceholder: 'Message {name}…',
    collectiveHoldings: 'Collective Holdings', positions: 'Positions',
    noHoldingsData: 'No collective holdings data',
    moreMembers: '+{count} more members', tokens: '{count} tokens',
    qty: 'qty', pctCollective: '% of collective',
  },
  live: {
    home: 'Home', live: 'Live', artists: 'Artists', you: 'You',
    all: 'All', following: 'Following', videos: 'Videos',
    painting: 'Painting', drawing: 'Drawing', digital: 'Digital',
    sculpture: 'Sculpture', mixedMedia: 'Mixed Media', trending: 'Trending',
    watching: '{count} watching', saveToPlaylist: 'Save to playlist',
    share: 'Share', report: 'Report', moreOptions: 'More options',
    goLive: 'Go Live', streamTitleLabel: 'Stream Title',
    streamTitlePlaceholder: 'What are you creating today?',
    categoryLabel: 'Category', starting: 'Starting…',
    startStreaming: '● Start Streaming', goLiveButton: 'Go Live',
    noContent: 'No content in this category',
  },
  studio: {
    createArtwork: 'Create Artwork', uploadPrompt: 'Drop Artwork · JPG / PNG / WEBP / MP4',
    uploadHint: 'Max 50 MB · Min 1200×1200px',
    artworkTitleLabel: 'Artwork Title', artworkTitlePlaceholder: 'e.g. Dissolution Study III',
    tickerLabel: 'Token Ticker', tickerHint: 'auto-generated · editable',
    categoryLabel: 'Category', descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe your artwork and its significance…',
    bondingCurveTypeLabel: 'Bonding Curve Type',
    totalSupplyLabel: 'Total Supply', initPriceLabel: 'Init Price (ETH)',
    creatorRoyaltyLabel: 'Creator Royalty',
    aiModeration: 'AI Moderation…', launchArtwork: '✦ Launch Artwork',
    previewLabel: 'Preview', curveLabel: '{type} curve',
    initPriceCard: 'Init Price', supplyCard: 'Supply', royaltyCard: 'Royalty',
    bondingCurveChart: 'Bonding Curve', priceVsSupply: 'price vs. supply',
    supply80: '80% supply', targetPrice: 'Target Price', at80Supply: 'at 80% supply',
    ethToGrad: 'ETH to Grad', graduationThreshold: 'graduation threshold',
    estGasCost: 'Est. Gas Cost', deployDesc: 'deploy on Base · {type} curve',
    launchChecklist: 'Launch Checklist',
    stepUpload: 'Upload Artwork', stepTitle: 'Fill Title & Description',
    stepTicker: 'Set Token Ticker', stepCategory: 'Choose Category',
    stepCurve: 'Configure Bonding Curve', stepAiCheck: 'AI Moderation Check',
    stepWallet: 'Connect Wallet', stepGas: 'Sufficient Gas Balance', stepDeploy: 'Deploy to Base',
    awaitingSubmission: 'Awaiting submission…',
    aiCheckDescription: 'AI checks for IP conflicts, prohibited content, and quality standards.',
    analyzing: 'Analyzing artwork…',
    approved: 'Approved — Ready to launch',
    approvedDetails: 'No IP conflicts · Content standards met · Quality OK',
    rejected: 'Rejected',
    rejectedMessage: 'Possible IP conflict detected. Review and resubmit.',
    breadcrumbStudio: 'Studio', breadcrumbNew: 'New Artwork',
    connected: 'Connected: {addr}', notConnected: 'Not connected',
  },
  vault: {
    portfolioValue: 'Portfolio Value', timeframe7d: '7D', timeframe30d: '30D', timeframe90d: '90D',
    allocation: 'Allocation', total: 'Total',
    portfolioValueStat: 'Portfolio Value', unrealizedPnl: 'Unrealized P&L',
    realizedPnl: 'Realized P&L', ethBalance: 'ETH Balance',
    myHoldings: 'My Holdings', txHistory: 'TX History',
    asset: 'Asset', qty: 'Qty', avgBuy: 'Avg Buy', current: 'Current',
    value: 'Value', pnl: 'P&L', chgPct: 'Chg %',
    date: 'Date', side: 'Side', token: 'Token', ethSpent: 'ETH Spent',
    buy: 'Buy', sell: 'Sell', realizedPnlClosed: 'Realized P&L (Closed Positions)',
    tradeLink: 'Trade →', noResults: 'No results',
  },
  settings: {
    title: 'Settings', accountSettings: 'Account Settings',
    accountSettingsDesc: 'Manage your profile, security, and preferences.',
    profileSection: 'Profile', usernameLabel: 'Username', usernamePlaceholder: 'your_username',
    bioLabel: 'Bio', bioPlaceholder: 'Tell the world about yourself…',
    saving: 'Saving…', saved: '✓ Saved', saveChanges: 'Save Changes',
    notificationsSection: 'Notifications',
    tradeAlerts: 'Trade Alerts', tradeAlertsDesc: 'Get notified when your artworks are traded',
    newFollowers: 'New Followers', newFollowersDesc: 'When someone follows your profile',
    priceMilestones: 'Price Milestones', priceMilestonesDesc: 'When an artwork hits a price target',
    securitySection: 'Security', authMethod: 'Auth Method',
    authMethodDesc: 'How you sign in to ArtCurve',
    session: 'Session', sessionDesc: 'You are currently signed in', active: 'Active',
    dangerZone: 'Danger Zone', signOut: 'Sign Out',
    signOutDesc: 'Sign out of your account on this device',
  },
  wallet: {
    signInTitle: 'Sign in to view your wallet',
    signInDesc: 'Connect with GitHub, X, or a crypto wallet to access your portfolio and on-chain activity.',
    title: 'Wallet', yourWallet: 'Your Wallet',
    walletDesc: 'Manage your identity, balance, and on-chain activity.',
    verified: 'Verified', anonymous: 'Anonymous', signOut: 'Sign out',
    connectedWallet: 'Connected Wallet', accountAddress: 'Account Address',
    smartAccount: 'Smart account · managed by platform',
    copy: 'Copy', copied: 'Copied', explorer: 'Explorer',
    ethBalance: 'ETH Balance', emptyWallet: 'Empty wallet',
    walletNotConnected: 'Wallet not connected',
    portfolio: 'Portfolio', noPositions: 'No positions',
    holdingsCount: '{count} holding', holdingsCountPlural: '{count} holdings',
    network: 'Network', authMethod: 'Auth Method',
    portfolioHoldings: 'Portfolio Holdings', totalPnl: 'Total P&L:',
    linkWalletTitle: 'Link an External Wallet',
    linkWalletDesc: 'Connect MetaMask or another wallet to trade directly on-chain, sign transactions, and verify ownership via SIWE.',
    noWalletsDetected: 'No wallets detected',
    noWalletsHint: 'Install MetaMask or another browser extension wallet',
    getMetaMask: 'Get MetaMask', showLess: 'Show less',
    showMore: 'Show {count} more wallets', detected: 'Detected',
    securitySection: 'Security', signInMethod: 'Sign-in method',
    walletVerification: 'Wallet verification',
    onChainWallet: 'On-Chain Wallet (SIWE)',
    verifiedViaSiwe: 'Verified via EIP-4361 signature',
    notVerified: 'Not verified — no wallet connected',
    accountRole: 'Account role', artist: 'Artist — can mint artworks',
    admin: 'Admin', collector: 'Collector', userId: 'User ID',
  },
  artwork: {
    backToMarketplace: 'Back to Marketplace', marketCap: 'Market Cap',
    change24h: '24h Change', holders: 'Holders', volume24h: 'Volume 24h',
    completion: 'Completion', phase: 'Phase', graduated: '✦ Graduated',
    bondingCurve: 'Bonding Curve', priceVsSupply: 'price vs. supply', now: 'now',
    buy: 'Buy {ticker}', collectorVoices: 'Collector Voices',
    poor: 'Poor', fair: 'Fair', good: 'Good', great: 'Great', exceptional: 'Exceptional',
    sharePerspective: 'Share your perspective on this work…',
    posting: 'Posting…', post: 'Post',
    connectToShare: 'Connect wallet to share a perspective.',
    connect: 'Connect', noPerspectives: 'No perspectives yet.',
    artworkNotFound: 'Artwork not found', topHolders: 'Top Holders',
  },
  error: {
    systemError: 'System Error', somethingWentWrong: 'Something went wrong', tryAgain: 'Try Again',
  },
  notFound: {
    label: 'Page not found',
    description: "This curve doesn't exist — or hasn't been deployed yet.",
    returnToMarket: 'Return to Market',
  },
  auth: { signingIn: 'Signing in…' },
}

export default en
