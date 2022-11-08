import { Currency, CurrencyAmount, TradeType } from '@pancakeswap/sdk'

import { getBestTradeFromV2 } from './getBestTradeFromV2'
import { getBestTradeWithStableSwap } from './getBestTradeWithStableSwap'
import { getStableSwapPairs } from './getStableSwapPairs'
import { TradeWithStableSwap, BestTradeOptions } from './types'

export async function getBestTrade<TInput extends Currency, TOutput extends Currency>(
  amountIn: CurrencyAmount<TInput>,
  output: TOutput,
  options: BestTradeOptions,
): Promise<TradeWithStableSwap<TInput, TOutput, TradeType> | null> {
  const { provider } = options
  // TODO invariant check input and output on the same chain
  const {
    currency: { chainId },
  } = amountIn

  const bestTradeV2 = await getBestTradeFromV2(amountIn, output, options)
  if (!bestTradeV2) {
    return null
  }

  const stableSwapPairs = await getStableSwapPairs(chainId)
  const bestTradeWithStableSwap = await getBestTradeWithStableSwap(bestTradeV2, stableSwapPairs, { provider })
  const { outputAmount: outputAmountWithStableSwap } = bestTradeWithStableSwap

  // If stable swap is not as good as best trade got from v2, then use v2
  if (outputAmountWithStableSwap.lessThan(bestTradeV2.outputAmount)) {
    return bestTradeV2
  }

  return bestTradeWithStableSwap
}
