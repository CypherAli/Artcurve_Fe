const en = {
  nav: {
    marketplace: 'Marketplace',
    trade:       'Trade',
    live:        'Live',
    guild:       'Guild',
    vault:       'Vault',
    studio:      'Studio',
  },
  header: {
    notifications:   'Notifications',
    markAllRead:     'Mark all read',
    allCaughtUp:     'All caught up',
    viewAllActivity: 'View all activity',
    clearAll:        'Clear all',
    all:             'All',
    unread:          'Unread',
    signOut:         'Sign out',
    connectWallet:   'Connect Wallet',
  },
  lang: {
    label:       'Language',
    search:      'Search language…',
  },
  common: {
    viewDetailReviews: 'View Detail & Reviews',
    buy:               'Buy',
    sell:              'Sell',
    collect:           'Collect',
    noReviewsYet:      'No reviews yet',
    loading:           'Loading…',
    error:             'Something went wrong',
  },
  marketplace: {
    title:       'Live Marketplace',
    subtitle:    'Trade unique artworks on the bonding curve.',
    totalVolume: 'Total Volume',
    listings:    'Live Listings',
    trades24h:   '24H Trades',
    all:         'All',
    search:      'Search…',
    race:        'Race',
    marketCap:   'Market Cap',
    change24h:   '24h Change',
    change7d:    '7d Change',
    liveActivity:'Live Activity',
  },
} as const

export type Translations = typeof en
export default en
