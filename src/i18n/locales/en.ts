export interface Translations {
  nav: {
    marketplace: string
    trade:       string
    live:        string
    guild:       string
    vault:       string
    studio:      string
  }
  header: {
    notifications:   string
    markAllRead:     string
    allCaughtUp:     string
    viewAllActivity: string
    clearAll:        string
    all:             string
    unread:          string
    signOut:         string
    connectWallet:   string
  }
  lang: {
    label:  string
    search: string
  }
  common: {
    viewDetailReviews: string
    buy:               string
    sell:              string
    collect:           string
    noReviewsYet:      string
    loading:           string
    error:             string
  }
  marketplace: {
    title:       string
    subtitle:    string
    totalVolume: string
    listings:    string
    trades24h:   string
    all:         string
    search:      string
    race:        string
    marketCap:   string
    change24h:   string
    change7d:    string
    liveActivity:string
  }
}

const en: Translations = {
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
    label:  'Language',
    search: 'Search language…',
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
}

export default en
