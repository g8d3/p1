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


# gainer loser fix


should be like:

#,Name, Symbol,Price,Volume,24h,Link
748,"OpenxAI","OPENX",$0.6071,"$1,264,598",60.7%,https:...

link selector is:

body > div.container > main > div.\[overflow-wrap\:anywhere\].xl\:tw-grid.xl\:tw-gap-x-9.xl\:tw-gap-y-4.xl\:tw-grid-cols-2.tw-flex-col > div.tw-flex-1.tw-mb-6 > div.tw-mb-3.tw-overflow-x-auto.\32 lg\:tw-overflow-x-visible.\32 lg\:tw-flex.\32 lg\:tw-justify-center > table > tbody > tr:nth-child(1) > td.tw-sticky.tw-left-\[51px\].md\:tw-left-\[72px\].tw-px-1.tw-py-2\.5.\32 lg\:tw-p-2\.5.tw-bg-inherit.tw-text-gray-900.dark\:tw-text-moon-50 > a

tr:nth-child(1) changes for next rows.

is not working, use these selectors:

name, tbody td:nth-child(3) div > div
symbol, tbody td:nth-child(3) div > div > div
link, tbody td:nth-child(3) a, get href from this
coin id, tbody td:nth-child(3) a > img, extract from src attr

for img src like "https://assets.coingecko.com/coins/images/22553/standard"  you should extract 22553