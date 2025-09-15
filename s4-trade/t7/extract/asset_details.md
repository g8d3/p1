from asset page these are the values I expect:

Market Cap 
Fully Diluted Valuation 
24 Hour Trading Vol 
Total Value Locked (TVL) 
Circulating Supply 
Total Supply 
Max Supply 

here is the selector for market cap: 
#gecko-coin-page-container > div.\32 lg\:tw-row-span-2.\32 lg\:tw-pr-6.\32 lg\:tw-border-r.tw-border-gray-200.dark\:tw-border-moon-700.tw-flex.tw-flex-col > div:nth-child(2) > table > tbody > tr:nth-child(1) > th

the next ones are tr:nth-child() with 2,3,4,5 and so on.

Another value I expect is contract address, its selector:

#gecko-coin-page-container > div.\32 lg\:tw-row-span-2.\32 lg\:tw-pr-6.\32 lg\:tw-border-r.tw-border-gray-200.dark\:tw-border-moon-700.tw-flex.tw-flex-col > div.tw-relative.\32 lg\:tw-mb-6.tw-grid.tw-grid-cols-1.tw-divide-y.tw-divide-gray-200.dark\:tw-divide-moon-700.\[\&\>\*\:last-child\]\:\!tw-border-b > div:nth-child(1) > div.tw-my-auto.tw-text-left.tw-text-gray-500.dark\:tw-text-moon-200.tw-font-medium.tw-text-sm.tw-leading-5


Another value I expect is market data, this one is a complex table which for simplicity will be extracted as is, but using this method:

1. get attr data-coin-id from element body > div.container > main > div
2. use that id to get table returned by:

https://www.coingecko.com/en/coins/<coin id>/markets/all/spot/rank_asc?items=100
https://www.coingecko.com/en/coins/<coin id>/markets/all/perpetuals/rank_asc?items=100

replace <coin id> with the id from step 1

from table in response extract:

rank
Exchange
exchange type
Pair
Price
Spread
+2% Depth
-2% Depth
24h Volume
Volume %
Last Updated
Trust Score

which are simply the columns of returned table.