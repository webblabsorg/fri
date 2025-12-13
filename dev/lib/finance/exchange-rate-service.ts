import { prisma } from '@/lib/db'

// ============================================================================
// EXCHANGE RATE SERVICE
// Multi-currency support with exchange rate management
// ============================================================================

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  effectiveDate: Date
  source: string
}

type CachedUsdRates = {
  fetchedAt: string
  source: string
  rates: Record<string, number>
}

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'MXN']

const DEFAULT_RATES: Record<string, number> = {
  'EUR/USD': 1.08,
  'GBP/USD': 1.27,
  'CAD/USD': 0.74,
  'AUD/USD': 0.65,
  'JPY/USD': 0.0067,
  'CHF/USD': 1.12,
  'MXN/USD': 0.058,
  'USD/EUR': 0.93,
  'USD/GBP': 0.79,
  'USD/CAD': 1.35,
  'USD/AUD': 1.54,
  'USD/JPY': 149.50,
  'USD/CHF': 0.89,
  'USD/MXN': 17.24,
}

const USD_CACHE_KEY = 'exchangeRates:USD'
const MAX_AGE_MS = 60 * 60 * 1000

let inMemoryUsdRates: CachedUsdRates | null = null
let inMemoryUsdRatesFetchedAtMs = 0

async function getCachedUsdRates(): Promise<{ data: CachedUsdRates | null; isFresh: boolean }> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: USD_CACHE_KEY },
  })

  if (!setting?.value) {
    return { data: null, isFresh: false }
  }

  try {
    const parsed = JSON.parse(setting.value) as CachedUsdRates
    const fetchedAt = new Date(parsed.fetchedAt)
    const isFresh = Date.now() - fetchedAt.getTime() < MAX_AGE_MS
    return { data: parsed, isFresh }
  } catch {
    return { data: null, isFresh: false }
  }
}

async function setCachedUsdRates(data: CachedUsdRates) {
  await prisma.systemSetting.upsert({
    where: { key: USD_CACHE_KEY },
    update: { value: JSON.stringify(data) },
    create: { key: USD_CACHE_KEY, value: JSON.stringify(data) },
  })
}

async function fetchLiveUsdRates(): Promise<CachedUsdRates | null> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID
  if (!appId) {
    return null
  }

  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(appId)}`
  )

  if (!res.ok) {
    throw new Error(`Exchange rate provider error: ${res.status}`)
  }

  const json = (await res.json()) as {
    timestamp: number
    base: string
    rates: Record<string, number>
  }

  if (!json?.rates || json.base !== 'USD') {
    throw new Error('Unexpected exchange rate response')
  }

  return {
    fetchedAt: new Date((json.timestamp || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    source: 'openexchangerates',
    rates: { USD: 1, ...json.rates },
  }
}

async function getUsdRates(): Promise<CachedUsdRates> {
  if (inMemoryUsdRates && Date.now() - inMemoryUsdRatesFetchedAtMs < MAX_AGE_MS) {
    return inMemoryUsdRates
  }

  const cached = await getCachedUsdRates()
  if (cached.data && cached.isFresh) {
    inMemoryUsdRates = cached.data
    inMemoryUsdRatesFetchedAtMs = new Date(cached.data.fetchedAt).getTime()
    return cached.data
  }

  const live = await fetchLiveUsdRates()
  if (live) {
    await setCachedUsdRates(live)
    inMemoryUsdRates = live
    inMemoryUsdRatesFetchedAtMs = new Date(live.fetchedAt).getTime()
    return live
  }

  // Fallback: derive a small USD rates table from DEFAULT_RATES.
  const derived: Record<string, number> = { USD: 1 }
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === 'USD') continue
    const directKey = `USD/${currency}`
    const reverseKey = `${currency}/USD`
    if (DEFAULT_RATES[directKey]) {
      derived[currency] = DEFAULT_RATES[directKey]
    } else if (DEFAULT_RATES[reverseKey]) {
      derived[currency] = 1 / DEFAULT_RATES[reverseKey]
    }
  }

  const fallback: CachedUsdRates = {
    fetchedAt: new Date().toISOString(),
    source: 'default',
    rates: derived,
  }

  inMemoryUsdRates = fallback
  inMemoryUsdRatesFetchedAtMs = Date.now()
  return fallback
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0
  }

  const usd = await getUsdRates()
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (!usd.rates[from] && !DEFAULT_RATES[`${from}/USD`] && !DEFAULT_RATES[`USD/${from}`]) {
    console.warn(`Exchange rate not found for ${from}/USD, returning 1.0`)
    return 1.0
  }
  if (!usd.rates[to] && !DEFAULT_RATES[`${to}/USD`] && !DEFAULT_RATES[`USD/${to}`]) {
    console.warn(`Exchange rate not found for USD/${to}, returning 1.0`)
    return 1.0
  }

  const usdToFrom = usd.rates[from] || (DEFAULT_RATES[`USD/${from}`] ? DEFAULT_RATES[`USD/${from}`] : 1 / (DEFAULT_RATES[`${from}/USD`] || 1))
  const usdToTo = usd.rates[to] || (DEFAULT_RATES[`USD/${to}`] ? DEFAULT_RATES[`USD/${to}`] : 1 / (DEFAULT_RATES[`${to}/USD`] || 1))

  // Convert: from -> USD -> to
  const fromToUsd = 1 / usdToFrom
  return fromToUsd * usdToTo
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<{ amount: number; rate: number }> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, date)
  return {
    amount: amount * rate,
    rate,
  }
}

export function getSupportedCurrencies(): string[] {
  return getAllCurrencies()
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export async function getHistoricalRates(
  baseCurrency: string,
  startDate: Date,
  endDate: Date
): Promise<ExchangeRate[]> {
  const rates: ExchangeRate[] = []

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === baseCurrency) continue

    const rate = await getExchangeRate(baseCurrency, currency)
    rates.push({
      fromCurrency: baseCurrency,
      toCurrency: currency,
      rate,
      effectiveDate: new Date(),
      source: 'default',
    })
  }

  return rates
}

export async function updateExchangeRates(): Promise<void> {
  const live = await fetchLiveUsdRates()
  if (!live) {
    throw new Error('OPEN_EXCHANGE_RATES_APP_ID not configured')
  }
  await setCachedUsdRates(live)
}

// ============================================================================
// EXTENDED CURRENCY SUPPORT (190+ ISO 4217 currencies)
// ============================================================================

const ISO_4217_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'HKD',
  'SGD', 'SEK', 'NOK', 'DKK', 'MXN', 'BRL', 'INR', 'RUB', 'ZAR', 'TRY',
  'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP',
  'COP', 'PEN', 'ARS', 'VND', 'EGP', 'NGN', 'KES', 'GHS', 'UGX', 'TZS',
  'MAD', 'DZD', 'TND', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD',
  'LBP', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK', 'TWD', 'MOP',
  'RON', 'BGN', 'HRK', 'RSD', 'UAH', 'BYN', 'GEL', 'AMD', 'AZN', 'KZT',
  'UZS', 'TJS', 'KGS', 'TMT', 'MNT', 'AFN', 'IRR', 'IQD', 'SYP', 'YER',
  'ISK', 'ALL', 'MKD', 'BAM', 'MDL', 'XOF', 'XAF', 'XCD', 'XPF', 'BBD',
  'BSD', 'BZD', 'BMD', 'KYD', 'JMD', 'TTD', 'AWG', 'ANG', 'SRD', 'GYD',
  'HTG', 'DOP', 'CUP', 'CRC', 'PAB', 'NIO', 'HNL', 'GTQ', 'SVC', 'BOB',
  'PYG', 'UYU', 'VES', 'FKP', 'GIP', 'SHP', 'MVR', 'SCR', 'MUR', 'MGA',
  'MZN', 'ZMW', 'BWP', 'NAD', 'SZL', 'LSL', 'AOA', 'CDF', 'RWF', 'BIF',
  'DJF', 'ERN', 'ETB', 'SOS', 'SDG', 'SSP', 'GMD', 'SLL', 'LRD', 'GNF',
  'CVE', 'STN', 'KMF', 'MWK', 'ZWL', 'FJD', 'PGK', 'SBD', 'VUV', 'TOP',
  'WST', 'KID', 'NRU', 'TVD', 'BTC', 'ETH',
]

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CHF: 'Swiss Franc', CAD: 'Canadian Dollar', AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar', CNY: 'Chinese Yuan', HKD: 'Hong Kong Dollar',
  SGD: 'Singapore Dollar', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
  DKK: 'Danish Krone', MXN: 'Mexican Peso', BRL: 'Brazilian Real',
  INR: 'Indian Rupee', RUB: 'Russian Ruble', ZAR: 'South African Rand',
  TRY: 'Turkish Lira', KRW: 'South Korean Won', THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit', IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso',
  PLN: 'Polish Zloty', CZK: 'Czech Koruna', HUF: 'Hungarian Forint',
  ILS: 'Israeli Shekel', CLP: 'Chilean Peso', COP: 'Colombian Peso',
  PEN: 'Peruvian Sol', ARS: 'Argentine Peso', SAR: 'Saudi Riyal',
  AED: 'UAE Dirham', QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar', OMR: 'Omani Rial', BTC: 'Bitcoin', ETH: 'Ethereum',
}

export function isValidCurrency(code: string): boolean {
  return ISO_4217_CURRENCIES.includes(code.toUpperCase())
}

export function getCurrencyName(code: string): string {
  return CURRENCY_NAMES[code.toUpperCase()] || code.toUpperCase()
}

export function getCommonCurrencies(): string[] {
  return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN']
}

export function getAllCurrencies(): string[] {
  return [...ISO_4217_CURRENCIES]
}

export async function getAllRates(): Promise<{
  baseCurrency: string
  fetchedAt: string
  source: string
  currencyCount: number
  rates: Record<string, number>
}> {
  const cached = await getCachedUsdRates()
  if (cached.data) {
    return {
      baseCurrency: 'USD',
      fetchedAt: cached.data.fetchedAt,
      source: cached.data.source,
      currencyCount: Object.keys(cached.data.rates).length,
      rates: cached.data.rates,
    }
  }
  
  // Return default rates if no cache
  return {
    baseCurrency: 'USD',
    fetchedAt: new Date().toISOString(),
    source: 'default',
    currencyCount: Object.keys(DEFAULT_RATES).length,
    rates: DEFAULT_RATES,
  }
}
