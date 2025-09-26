# Current Features

## Scheduled URL Visits
- Automatically visit specified URLs at set intervals (in seconds).
- Execute custom JavaScript code on the visited pages to extract or interact with data.

## Data Sinks
- **Clipboard**: Copy extracted data to the system clipboard.
- **POST**: Send data via HTTP POST to a specified URL.

## Presets
- **CoinGecko**: Scrapes top crypto gainers and losers from CoinGecko, extracting coin data including names, symbols, prices, and links.
- **Local**: Test preset for localhost pages, extracts table data for debugging.

## User Interface
- Popup interface to configure settings: interval, URL, JS code, sink, and POST URL.
- Buttons to save settings, run once, start/stop scheduled runs.
- Real-time display of extracted data and error messages.

## Background Processing
- Service worker handles scheduling and alarms.
- Content scripts execute JS on target pages and communicate results back.