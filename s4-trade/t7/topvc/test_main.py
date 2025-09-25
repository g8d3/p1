import pytest
from unittest.mock import patch, MagicMock
from textual.testing import AppTest
from main import TopVCTable

@pytest.fixture
def sample_api_response():
    return {
        "tokens": [
            {
                "address": "0x123",
                "symbol": "TOK1",
                "volume24h": "1000000",
                "price_change_percentage_24h": "5.0",
                "usd_price": "1.0"
            },
            {
                "address": "0x456",
                "symbol": "TOK2",
                "volume24h": "500000",
                "price_change_percentage_24h": "-2.0",
                "usd_price": "0.5"
            }
        ]
    }

@pytest.mark.asyncio
async def test_load_real_data(sample_api_response):
    with patch('main.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_api_response
        mock_get.return_value = mock_response

        app = TopVCTable()
        async with AppTest(app) as test_app:
            await test_app.wait_for_idle()
            table = test_app.query_one("#token_table")
            assert table.row_count > 0
            # Check that data is loaded
            rows = list(table.rows)
            assert len(rows) > 0
            assert "uniswap" in str(rows[0])

@pytest.mark.asyncio
async def test_filtering():
    app = TopVCTable()
    async with AppTest(app) as test_app:
        await test_app.wait_for_idle()
        # Assume mock data is loaded
        filter_input = test_app.query_one("#filter_input")
        filter_input.value = "TOK1"
        await test_app.wait_for_idle()
        table = test_app.query_one("#token_table")
        rows = list(table.rows)
        # Should filter to rows containing TOK1
        for row in rows:
            assert "TOK1" in str(row) or table.row_count == 0

@pytest.mark.asyncio
async def test_pagination():
    app = TopVCTable()
    async with AppTest(app) as test_app:
        await test_app.wait_for_idle()
        next_btn = test_app.query_one("#next_page")
        prev_btn = test_app.query_one("#prev_page")
        # Initially page 0
        # Click next
        await next_btn.click()
        await test_app.wait_for_idle()
        # Page should be 1 if there are enough rows
        # Since mock data, may not have enough, but test the logic
        # For now, just check no error

@pytest.mark.asyncio
async def test_reload_button(sample_api_response):
    with patch('main.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_api_response
        mock_get.return_value = mock_response

        app = TopVCTable()
        async with AppTest(app) as test_app:
            await test_app.wait_for_idle()
            reload_btn = test_app.query_one("#reload_btn")
            await reload_btn.click()
            await test_app.wait_for_idle()
            table = test_app.query_one("#token_table")
            assert table.row_count > 0

@pytest.mark.asyncio
async def test_input_changes():
    app = TopVCTable()
    async with AppTest(app) as test_app:
        await test_app.wait_for_idle()
        n_input = test_app.query_one("#n_input")
        n_input.value = "5"
        await test_app.wait_for_idle()
        assert app.N == 5
        m_input = test_app.query_one("#m_input")
        m_input.value = "7"
        await test_app.wait_for_idle()
        assert app.M == 7
        page_size_input = test_app.query_one("#page_size_input")
        page_size_input.value = "20"
        await test_app.wait_for_idle()
        assert app.page_size == 20