import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import {
  getExchangeRate,
  convertCurrency,
  getAllRates,
  getAllCurrencies,
  getCommonCurrencies,
  getCurrencyName,
} from '@/lib/finance/exchange-rate-service'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || 'USD'
    const to = searchParams.get('to')
    const amount = searchParams.get('amount')

    if (to && amount) {
      const result = await convertCurrency(parseFloat(amount), from, to)
      return NextResponse.json({
        from,
        to,
        originalAmount: parseFloat(amount),
        convertedAmount: result.amount,
        rate: result.rate,
      })
    }

    if (to) {
      const rate = await getExchangeRate(from, to)
      return NextResponse.json({ from, to, rate })
    }

    const allRates = await getAllRates()
    const supportedCurrencies = getAllCurrencies()
    const commonCurrencies = getCommonCurrencies()

    return NextResponse.json({
      baseCurrency: allRates.baseCurrency,
      fetchedAt: allRates.fetchedAt,
      source: allRates.source,
      currencyCount: supportedCurrencies.length,
      commonCurrencies: commonCurrencies.map((c: string) => ({ code: c, name: getCurrencyName(c) })),
      supportedCurrencies,
      rates: allRates.rates,
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
