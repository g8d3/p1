package main

import (
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/charmbracelet/bubbles/table"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type Row struct {
	Dex       string
	Timeframe string
	Type      string
	Token     string
	Symbol    string
	Volume    string
	Change    string
	Price     string
}

type model struct {
	table      table.Model
	inputs     []textinput.Model
	focusIndex int
	rows       []Row
	filtered   []Row
	page       int
	pageSize   int
	n          int
	m          int
	filter     string
}

func initialModel() model {
	ti1 := textinput.New()
	ti1.Placeholder = "N (top volume)"
	ti1.SetValue("10")

	ti2 := textinput.New()
	ti2.Placeholder = "M (top change)"
	ti2.SetValue("10")

	ti3 := textinput.New()
	ti3.Placeholder = "Page size"
	ti3.SetValue("50")

	ti4 := textinput.New()
	ti4.Placeholder = "Filter"

	columns := []table.Column{
		{Title: "DEX", Width: 12},
		{Title: "Timeframe", Width: 10},
		{Title: "Type", Width: 8},
		{Title: "Token", Width: 45},
		{Title: "Symbol", Width: 10},
		{Title: "Volume", Width: 15},
		{Title: "Change %", Width: 10},
		{Title: "Price", Width: 12},
	}

	t := table.New(
		table.WithColumns(columns),
		table.WithFocused(true),
		table.WithHeight(20),
	)

	s := table.DefaultStyles()
	s.Header = s.Header.
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("240")).
		BorderBottom(true).
		Bold(false)
	s.Selected = s.Selected.
		Foreground(lipgloss.Color("229")).
		Background(lipgloss.Color("57")).
		Bold(false)
	t.SetStyles(s)

	return model{
		table:      t,
		inputs:     []textinput.Model{ti1, ti2, ti3, ti4},
		focusIndex: 0,
		rows:       []Row{},
		filtered:   []Row{},
		page:       0,
		pageSize:   50,
		n:          10,
		m:          10,
		filter:     "",
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(m.loadData(), m.inputs[0].Focus())
}

func (m model) loadData() tea.Cmd {
	return func() tea.Msg {
		var allRows []Row
		dexes := []string{"uniswap", "pancakeswap"}
		timeframes := []string{"5m", "30m", "1h"}

		for _, dex := range dexes {
			volumeTokens, changeTokens, err := fetchTokens(dex, m.n, m.m)
			if err != nil {
				log.Printf("Error fetching %s: %v", dex, err)
				continue
			}
			for _, tf := range timeframes {
				for _, token := range volumeTokens {
					row := Row{
						Dex:       dex,
						Timeframe: tf,
						Type:      "Volume",
						Token:     token.TokenAddress,
						Symbol:    token.TokenSymbol,
						Volume:    fmt.Sprintf("%.0f", token.Volume24h),
						Change:    fmt.Sprintf("%.2f%%", token.PriceChangePercentage24h),
						Price:     fmt.Sprintf("%.4f", token.UsdPrice),
					}
					allRows = append(allRows, row)
				}
				for _, token := range changeTokens {
					row := Row{
						Dex:       dex,
						Timeframe: tf,
						Type:      "Change",
						Token:     token.TokenAddress,
						Symbol:    token.TokenSymbol,
						Volume:    fmt.Sprintf("%.0f", token.Volume24h),
						Change:    fmt.Sprintf("%.2f%%", token.PriceChangePercentage24h),
						Price:     fmt.Sprintf("%.4f", token.UsdPrice),
					}
					allRows = append(allRows, row)
				}
			}
		}
		return dataLoadedMsg{rows: allRows}
	}
}

type dataLoadedMsg struct {
	rows []Row
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "tab":
			m.focusIndex = (m.focusIndex + 1) % len(m.inputs)
			for i := range m.inputs {
				if i == m.focusIndex {
					cmd = m.inputs[i].Focus()
				} else {
					m.inputs[i].Blur()
				}
			}
		case "enter":
			if m.focusIndex == len(m.inputs)-1 {
				m.filter = m.inputs[m.focusIndex].Value()
				m.updateFiltered()
				m.page = 0
				m.updateTable()
			} else {
				val, err := strconv.Atoi(m.inputs[m.focusIndex].Value())
				if err == nil {
					switch m.focusIndex {
					case 0:
						m.n = val
					case 1:
						m.m = val
					case 2:
						m.pageSize = val
						m.page = 0
					}
					cmd = m.loadData()
				}
			}
		case "r":
			cmd = m.loadData()
		case "left", "h":
			if m.page > 0 {
				m.page--
				m.updateTable()
			}
		case "right", "l":
			if (m.page+1)*m.pageSize < len(m.filtered) {
				m.page++
				m.updateTable()
			}
		}
	case dataLoadedMsg:
		m.rows = msg.rows
		m.updateFiltered()
		m.updateTable()
	}

	for i := range m.inputs {
		if i == m.focusIndex {
			m.inputs[i], cmd = m.inputs[i].Update(msg)
		}
	}

	m.table, cmd = m.table.Update(msg)
	return m, cmd
}

func (m *model) updateFiltered() {
	if m.filter == "" {
		m.filtered = m.rows
	} else {
		var filtered []Row
		query := strings.ToLower(m.filter)
		for _, row := range m.rows {
			if strings.Contains(strings.ToLower(row.Dex), query) ||
				strings.Contains(strings.ToLower(row.Token), query) ||
				strings.Contains(strings.ToLower(row.Symbol), query) {
				filtered = append(filtered, row)
			}
		}
		m.filtered = filtered
	}
}

func (m *model) updateTable() {
	start := m.page * m.pageSize
	end := start + m.pageSize
	if end > len(m.filtered) {
		end = len(m.filtered)
	}
	var tableRows []table.Row
	for _, row := range m.filtered[start:end] {
		tableRows = append(tableRows, table.Row{row.Dex, row.Timeframe, row.Type, row.Token, row.Symbol, row.Volume, row.Change, row.Price})
	}
	m.table.SetRows(tableRows)
}

func (m model) View() string {
	var b strings.Builder

	for i, input := range m.inputs {
		if i == m.focusIndex {
			b.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("205")).Render(input.View()))
		} else {
			b.WriteString(input.View())
		}
		b.WriteString(" ")
	}
	b.WriteString("\n\n")

	b.WriteString(fmt.Sprintf("Page %d of %d\n", m.page+1, (len(m.filtered)+m.pageSize-1)/m.pageSize))
	b.WriteString(m.table.View())
	b.WriteString("\n\nPress r to reload, tab to switch inputs, enter to apply, q to quit")

	return b.String()
}

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		log.Fatal(err)
	}
}
