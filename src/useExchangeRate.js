import { useState, useEffect } from 'react'

const CACHE_KEY = 'arcsplit-rates'
const CACHE_TTL = 30 * 60 * 1000

export function useExchangeRate() {
  const [rates, setRates] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      if (Date.now() - ts < CACHE_TTL) return data
    }
    return { krw: 1380, usd: 1.0 }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { ts } = JSON.parse(cached)
      if (Date.now() - ts < CACHE_TTL) return
    }

    setLoading(true)
    fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=KRW')
      .then(r => r.json())
      .then(data => {
        const krwRate = data.rates?.KRW || 1380
        const newRates = { krw: krwRate, usd: 1.0 }
        setRates(newRates)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newRates, ts: Date.now() }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { rates, loading }
}
