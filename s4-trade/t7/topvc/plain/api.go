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
	"uniswap":     {"0x1", "uniswap-v3"},
	"pancakeswap": {"0x38", "pancakeswap-v2"},
	"aerodrome":   {"0x2105", "aerodrome"},
	"raydium":     {"solana", "raydium"},
	"orca":        {"solana", "orca"},
	"meteora":     {"solana", "meteora"},
	"hyperliquid": {"0xa4b1", "hyperliquid"},
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

	url := fmt.Sprintf("https://deep-index.moralis.io/api/v2.2/erc20/exchange/%s/tokens", config.Exchange)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("X-API-Key", apiKey)
	q := req.URL.Query()
	q.Add("chain", config.Chain)
	q.Add("limit", strconv.Itoa(max(n, m)*2))
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
	volumeTokens := make([]Token, len(tokens))
	copy(volumeTokens, tokens)
	sort.Slice(volumeTokens, func(i, j int) bool {
		return volumeTokens[i].Volume24h > volumeTokens[j].Volume24h
	})
	volumeTokens = volumeTokens[:min(n, len(volumeTokens))]

	// Sort for change
	changeTokens := make([]Token, len(tokens))
	copy(changeTokens, tokens)
	sort.Slice(changeTokens, func(i, j int) bool {
		return changeTokens[i].PriceChangePercentage24h > changeTokens[j].PriceChangePercentage24h
	})
	changeTokens = changeTokens[:min(m, len(changeTokens))]

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
		addr := t.TokenAddress
		if len(addr) > 18 {
			addr = addr[:18] + "..."
		}
		fmt.Printf("%-10s %-20s %-15.2f %-15.2f %-10.2f\n", t.TokenSymbol, addr, t.Volume24h, t.PriceChangePercentage24h, t.UsdPrice)
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

	timeframes := []string{"oneHour", "thirtyMinutes", "fiveMinutes"}
	dexes := []string{"uniswap", "pancakeswap", "aerodrome", "raydium", "orca", "meteora"}

	timeframeDisplay := map[string]string{"oneHour": "1h", "thirtyMinutes": "30m", "fiveMinutes": "5m"}
	for _, tf := range timeframes {
		fmt.Printf("Timeframe: %s\n", timeframeDisplay[tf])
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
