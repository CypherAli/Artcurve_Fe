import { usePriceStore } from './priceStore'

beforeEach(() => {
  usePriceStore.setState({ prices: {}, volumes: {} })
})

describe('usePriceStore', () => {
  it('setPrice stores a single price', () => {
    usePriceStore.getState().setPrice('art1', '0.5')
    expect(usePriceStore.getState().prices['art1']).toBe('0.5')
  })

  it('setVolume stores a single volume', () => {
    usePriceStore.getState().setVolume('art1', '10.0')
    expect(usePriceStore.getState().volumes['art1']).toBe('10.0')
  })

  it('batchUpdate merges multiple prices and volumes', () => {
    usePriceStore.getState().setPrice('existing', '1.0')
    usePriceStore.getState().batchUpdate([
      { artwork_id: 'a1', price: '0.1', volume_24h: '5' },
      { artwork_id: 'a2', price: '0.2' },
    ])
    const s = usePriceStore.getState()
    expect(s.prices['a1']).toBe('0.1')
    expect(s.prices['a2']).toBe('0.2')
    expect(s.prices['existing']).toBe('1.0')
    expect(s.volumes['a1']).toBe('5')
    expect(s.volumes['a2']).toBeUndefined()
  })
})
