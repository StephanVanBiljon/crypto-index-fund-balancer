from pydantic import BaseModel
from decimal import Decimal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

class CoinInput(BaseModel):
    symbol: str
    market_cap: Decimal
    price: Decimal


class FundInput(BaseModel):
    asset_cap: Decimal
    total_capital: Decimal
    coins: list[CoinInput]


@app.post("/fund-asset-allocator")
def calculate_fund_allocation(fund: FundInput):
    """
    Calculate the amount, price, and percentage of each coin in the fund.

    Args:
        asset_cap (Decimal): The maximum asset cap percentage for the fund.
        total_capital (Decimal): The total capital of the fund in ZAR.
        coins (list[tuple[str, Decimal, Decimal]]): A list of coin details for each
            coin in the fund where each element contains (coin symbol, market cap, price).

    Returns:
        list[dict[str, tuple(Decimal, Decimal, Decimal)]]: A list of dictionaries, where each dictionary contains
            the (amount, price, percentage of the fund) details of a coin in the fund.
    """
    asset_cap = fund.asset_cap
    total_capital = fund.total_capital
    coins = [(coin.symbol, coin.market_cap, coin.price) for coin in fund.coins]

    return process_fund_allocation(asset_cap, total_capital, coins)


def process_fund_allocation(asset_cap, total_capital, coins):
    fund_list = []
    coin_price_cap = total_capital * (asset_cap / 100)
    recalculated_total_capital = total_capital

    # Order the coins list in descending order by market cap.
    sorted_coins = sorted(coins, key=lambda x: x[1], reverse=True)
    market_cap_total = sum(coin[1] for coin in sorted_coins)
    
    
     # The smallest valid asset_cap needs to be larger than (1) / (# of coins):
    min_valid_asset_cap = Decimal(1) / len(sorted_coins)

    if (asset_cap / 100) < min_valid_asset_cap:
        coin_price_cap = total_capital * min_valid_asset_cap

    for coin in sorted_coins:
        unrestricted_allocation = (coin[1] / market_cap_total) * recalculated_total_capital

        total_price = min(coin_price_cap, unrestricted_allocation)
        percentage = (total_price / total_capital) * 100
        amount = total_price / coin[2]

        # Update the remaining market cap and capital.
        market_cap_total -= coin[1]
        recalculated_total_capital -= total_price

        fund_list.append({coin[0]: (amount, total_price, percentage)})

    return fund_list
