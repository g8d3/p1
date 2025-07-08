import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('ClickHouse Playground', () => {
  test('renders Connect Web3 Wallet button when not connected', () => {
    render(<App />);
    expect(screen.getByText(/Connect Web3 Wallet/i)).toBeInTheDocument();
  });

  test('shows welcome message when not connected', () => {
    render(<App />);
    expect(screen.getByText(/Welcome! Please connect your Web3 wallet/i)).toBeInTheDocument();
  });

  // More tests will be added for each feature in the plan
});
