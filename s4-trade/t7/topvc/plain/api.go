package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
)

type DexConfig struct {
	Chain    string
	Exchange string
}

var dexConfigs = map[string]DexConfig{
	"uniswap":     {"0x1", "0x1c87257f5e8609940bc751a07bb085bb7f8cdbe"},
	"pancakeswap": {"0x38", "0x10ed43c718714eb63d5aa57b78b54704e256024e"},     // BSC
	"aerodrome":   {"0x2105", "0x6b75a6f6c4c47c3a43b5a6c3a43b5a6c3a43b5a6"},   // Base
	"raydium":     {"solana", "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"}, // Solana
	"orca":        {"solana", "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP"},
	"meteora":     {"solana", "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5Ua"},
	"hyperliquid": {"0xa4b1", "0x123"}, // Arbitrum, placeholder
}

type Token struct {
	TokenAddress             string  `json:"token_address"`
	TokenSymbol              string  `json:"token_symbol"`
	Volume24h                float64 `json:"volume_24h"`
	PriceChangePercentage24h float64 `json:"price_change_percentage_24h"`
	UsdPrice                 float64 `json:"usd_price"`
}

type ApiResponse struct {
	Tokens []Token `json:"tokens"`
}

func fetchTokens(dex string, n, m int, timeframe string) ([]Token, []Token, error) {
	config, ok := dexConfigs[dex]
	if !ok {
		return nil, nil, fmt.Errorf("unknown dex: %s", dex)
	}

	apiKey := os.Getenv("MORALIS_API_KEY")
	if apiKey == "" {
		return nil, nil, fmt.Errorf("MORALIS_API_KEY not set")
	}

	url := fmt.Sprintf("https://deep-index.moralis.io/api/v2.2/erc20/%s/dex/%s/tokens", config.Chain, config.Exchange)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("X-API-Key", apiKey)
	q := req.URL.Query()
	q.Add("limit", strconv.Itoa(max(n, m)*2))
	q.Add("timeframe", timeframe)
	req.URL.RawQuery = q.Encode()

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, nil, fmt.Errorf("API error: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}

	var apiResp ApiResponse
	err = json.Unmarshal(body, &apiResp)
	if err != nil {
		return nil, nil, err
	}

	tokens := apiResp.Tokens

	// Sort for volume
	sort.Slice(tokens, func(i, j int) bool {
		return tokens[i].Volume24h > tokens[j].Volume24h
	})
	volumeTokens := tokens[:min(n, len(tokens))]

	// Sort for change
	sort.Slice(tokens, func(i, j int) bool {
		return tokens[i].PriceChangePercentage24h > tokens[j].PriceChangePercentage24h
	})
	changeTokens := tokens[:min(m, len(tokens))]

	return volumeTokens, changeTokens, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func printTable(title string, tokens []Token) {
	fmt.Println(title)
	fmt.Printf("%-10s %-20s %-15s %-15s %-10s\n", "Symbol", "Address", "Volume", "Change %", "Price")
	fmt.Println(strings.Repeat("-", 80))
	for _, t := range tokens {
		fmt.Printf("%-10s %-20s %-15.2f %-15.2f %-10.2f\n", t.TokenSymbol, t.TokenAddress[:18]+"...", t.Volume24h, t.PriceChangePercentage24h, t.UsdPrice)
	}
	fmt.Println()
}

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run . <N> <M>")
		os.Exit(1)
	}
	n, err := strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Println("Invalid N")
		os.Exit(1)
	}
	m, err := strconv.Atoi(os.Args[2])
	if err != nil {
		fmt.Println("Invalid M")
		os.Exit(1)
	}

	timeframes := []string{"1h", "30m", "5m"}
	dexes := []string{"uniswap", "pancakeswap", "aerodrome", "raydium", "orca", "meteora"}

	for _, tf := range timeframes {
		fmt.Printf("Timeframe: %s\n", tf)
		for _, dex := range dexes {
			volumeTokens, changeTokens, err := fetchTokens(dex, n, m, tf)
			if err != nil {
				fmt.Printf("Error fetching %s for %s: %v\n", dex, tf, err)
				continue
			}
			printTable(fmt.Sprintf("DEX: %s - Top Volume Tokens", dex), volumeTokens)
			printTable(fmt.Sprintf("DEX: %s - Top Change Tokens", dex), changeTokens)
		}
	}
}
