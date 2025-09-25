#!/usr/bin/env python3

import os
from textual.app import App, ComposeResult
from textual.widgets import DataTable, Header, Footer, Input, Button, Label
from textual.scroll_view import ScrollView
from textual.containers import Vertical, Horizontal
import requests
import asyncio
from datetime import datetime, timedelta

MORALIS_API_KEY = os.getenv('MORALIS_API_KEY')
if not MORALIS_API_KEY:
    print("Warning: MORALIS_API_KEY not set, using mock data")

DEX_CONFIG = {
    "uniswap": {"chain": "0x1", "exchange": "0x1c87257f5e8609940bc751a07bb085bb7f8cdbe"},
    # Add others later
}

DEXES = list(DEX_CONFIG.keys())
TIMEFRAMES = ["5m", "30m", "1h"]

class TopVCTable(App):
    """A Textual app to display top volume and change tokens from Moralis."""

    def __init__(self):
        super().__init__()
        self.all_rows = []
        self.filtered_rows = []
        self.page = 0
        self.page_size = 50
        self.N = 10
        self.M = 10

    def compose(self) -> ComposeResult:
        yield Header()
        yield Vertical(
            Horizontal(
                Label("N (top volume):"), Input(value="10", id="n_input"),
                Label("M (top change):"), Input(value="10", id="m_input"),
                Label("Page size:"), Input(value="50", id="page_size_input"),
                Button("Reload", id="reload_btn"),
            ),
            Horizontal(
                Input(placeholder="Filter by DEX, Token, Symbol...", id="filter_input"),
                Button("Previous", id="prev_page"),
                Button("Next", id="next_page"),
            ),
            ScrollView(DataTable(id="token_table")),
        )
        yield Footer()

    async def on_mount(self) -> None:
        table = self.query_one("#token_table", DataTable)
        table.add_columns("DEX", "Timeframe", "Type", "Token", "Symbol", "Volume", "Change %", "Price")
        # Fetch and populate data
        await self.load_data(table)

    async def load_data(self, table: DataTable):
        self.all_rows = []
        if MORALIS_API_KEY:
            await self.fetch_real_data()
        else:
            await self.fetch_mock_data()
        self.filtered_rows = self.all_rows[:]
        self.update_table(table)

    async def fetch_real_data(self):
        headers = {"X-API-Key": MORALIS_API_KEY}
        for dex in DEXES:
            config = DEX_CONFIG[dex]
            url = f"https://deep-index.moralis.io/api/v2.2/erc20/{config['chain']}/dex/{config['exchange']}/tokens"
            params = {"limit": max(self.N, self.M) * 2}  # fetch more to sort
            response = await asyncio.to_thread(requests.get, url, headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                tokens = data.get("tokens", [])
                # Sort for volume
                volume_tokens = sorted(tokens, key=lambda t: float(t.get("volume_24h", 0)), reverse=True)[:self.N]
                # Sort for change
                change_tokens = sorted(tokens, key=lambda t: float(t.get("price_change_percentage_24h", 0)), reverse=True)[:self.M]
                for tf in TIMEFRAMES:
                    for token in volume_tokens:
                        row = (
                            dex, tf, "Volume",
                            token.get("token_address", ""),
                            token.get("token_symbol", ""),
                            f"{float(token.get('volume_24h', 0)):.0f}",
                            f"{float(token.get('price_change_percentage_24h', 0)):.2f}%",
                            f"{float(token.get('usd_price', 0)):.4f}"
                        )
                        self.all_rows.append(row)
                    for token in change_tokens:
                        row = (
                            dex, tf, "Change",
                            token.get("token_address", ""),
                            token.get("token_symbol", ""),
                            f"{float(token.get('volume_24h', 0)):.0f}",
                            f"{float(token.get('price_change_percentage_24h', 0)):.2f}%",
                            f"{float(token.get('usd_price', 0)):.4f}"
                        )
                        self.all_rows.append(row)
            else:
                print(f"Error fetching data for {dex}: {response.status_code}")

    async def fetch_mock_data(self):
        import random
        for dex in DEXES:
            for tf in TIMEFRAMES:
                for i in range(self.N):
                    row = (
                        dex, tf, "Volume",
                        f"Token{i}", f"TOK{i}",
                        f"{random.randint(1000, 1000000)}",
                        f"{random.uniform(-10, 10):.2f}%",
                        f"{random.uniform(0.01, 100):.4f}"
                    )
                    self.all_rows.append(row)
                for i in range(self.M):
                    row = (
                        dex, tf, "Change",
                        f"Token{i}", f"TOK{i}",
                        f"{random.randint(1000, 1000000)}",
                        f"{random.uniform(-50, 50):.2f}%",
                        f"{random.uniform(0.01, 100):.4f}"
                    )
                    self.all_rows.append(row)

    def update_table(self, table: DataTable):
        table.clear()
        start = self.page * self.page_size
        end = start + self.page_size
        for row in self.filtered_rows[start:end]:
            table.add_row(*row)

    def on_input_changed(self, event: Input.Changed) -> None:
        if event.input.id == "filter_input":
            query = event.value.lower()
            self.filtered_rows = [row for row in self.all_rows if any(query in str(cell).lower() for cell in row)]
            self.page = 0
            table = self.query_one("#token_table", DataTable)
            self.update_table(table)
        elif event.input.id == "n_input":
            try:
                self.N = int(event.value)
            except ValueError:
                pass
        elif event.input.id == "m_input":
            try:
                self.M = int(event.value)
            except ValueError:
                pass
        elif event.input.id == "page_size_input":
            try:
                self.page_size = int(event.value)
                self.page = 0
                table = self.query_one("#token_table", DataTable)
                self.update_table(table)
            except ValueError:
                pass

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "prev_page" and self.page > 0:
            self.page -= 1
        elif event.button.id == "next_page" and (self.page + 1) * self.page_size < len(self.filtered_rows):
            self.page += 1
        elif event.button.id == "reload_btn":
            table = self.query_one("#token_table", DataTable)
            asyncio.create_task(self.load_data(table))
        table = self.query_one("#token_table", DataTable)
        self.update_table(table)

if __name__ == "__main__":
    app = TopVCTable()
    app.run()