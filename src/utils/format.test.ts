import {
  formatEth,
  formatPrice,
  formatSupply,
  formatPnl,
  truncateAddress,
  timeAgo,
  bondingCurveFill,
} from './format'

describe('formatEth', () => {
  it('formats string value', () => {
    expect(formatEth('0.00100000')).toBe('0.001 ETH')
  })

  it('formats number value', () => {
    expect(formatEth(1.5)).toBe('1.5 ETH')
  })

  it('handles NaN', () => {
    expect(formatEth('abc')).toBe('— ETH')
  })

  it('respects custom decimals', () => {
    expect(formatEth(0.123456, 6)).toBe('0.123456 ETH')
  })

  it('formats zero', () => {
    expect(formatEth(0)).toBe('0 ETH')
  })
})

describe('formatPrice', () => {
  it('formats small numbers', () => {
    expect(formatPrice('0.00100000')).toBe('0.001')
  })

  it('formats thousands as K', () => {
    expect(formatPrice(12345.678)).toBe('12.35K')
  })

  it('formats millions as M', () => {
    expect(formatPrice(1500000)).toBe('1.50M')
  })

  it('handles NaN', () => {
    expect(formatPrice('abc')).toBe('—')
  })
})

describe('formatSupply', () => {
  it('formats large numbers as K', () => {
    expect(formatSupply('100000')).toBe('100.0K')
  })

  it('formats millions', () => {
    expect(formatSupply(2500000)).toBe('2.5M')
  })

  it('formats small numbers', () => {
    expect(formatSupply(500)).toBe('500')
  })

  it('handles NaN', () => {
    expect(formatSupply('abc')).toBe('—')
  })
})

describe('formatPnl', () => {
  it('formats positive P&L', () => {
    const result = formatPnl(12.34)
    expect(result.text).toBe('+12.34%')
    expect(result.isPositive).toBe(true)
  })

  it('formats negative P&L', () => {
    const result = formatPnl(-5.67)
    expect(result.text).toBe('-5.67%')
    expect(result.isPositive).toBe(false)
  })

  it('formats zero as positive', () => {
    const result = formatPnl(0)
    expect(result.text).toBe('+0.00%')
    expect(result.isPositive).toBe(true)
  })

  it('handles NaN', () => {
    const result = formatPnl('abc')
    expect(result.text).toBe('—')
  })
})

describe('truncateAddress', () => {
  it('truncates a standard Ethereum address', () => {
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678'))
      .toBe('0x1234...5678')
  })

  it('handles empty string', () => {
    expect(truncateAddress('')).toBe('')
  })

  it('returns short address unchanged', () => {
    expect(truncateAddress('0x1234')).toBe('0x1234')
  })

  it('supports custom char counts', () => {
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 10, 6))
      .toBe('0x12345678...345678')
  })
})

describe('timeAgo', () => {
  it('returns "just now" for recent timestamps', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    expect(timeAgo(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString()
    expect(timeAgo(twoDaysAgo)).toBe('2d ago')
  })
})

describe('bondingCurveFill', () => {
  it('calculates fill percentage', () => {
    expect(bondingCurveFill('50', '100')).toBe(50)
  })

  it('caps at 100%', () => {
    expect(bondingCurveFill('150', '100')).toBe(100)
  })

  it('returns 0 for invalid inputs', () => {
    expect(bondingCurveFill('abc', '100')).toBe(0)
    expect(bondingCurveFill('50', '0')).toBe(0)
  })
})
