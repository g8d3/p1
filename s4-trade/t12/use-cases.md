# Wallet Demo Use Cases

## 1. Connect Wallet
- **Description**: User clicks "Connect Wallet" button to authenticate and access wallet management features.
- **Preconditions**: User is not authenticated.
- **Steps**:
  1. Click "Connect Wallet" button.
- **Expected Result**: User is authenticated, wallet management UI appears, initial wallets loaded if any.
- **Manual Test Time**: 5-10 seconds (wallet popup, signing message).

## 2. Disconnect Wallet
- **Description**: User disconnects from the wallet manager.
- **Preconditions**: User is authenticated.
- **Steps**:
  1. Click "Disconnect" button.
- **Expected Result**: User is logged out, UI resets to connect screen.
- **Manual Test Time**: 1-2 seconds.

## 3. Select Network
- **Description**: User selects a blockchain network (e.g., Ethereum, Solana).
- **Preconditions**: User is authenticated.
- **Steps**:
  1. Select network from dropdown.
- **Expected Result**: Network is updated, generation count resets for new network.
- **Manual Test Time**: 1-2 seconds.

## 4. Set Wallet Count
- **Description**: User sets the number of wallets to generate.
- **Preconditions**: User is authenticated.
- **Steps**:
  1. Enter count in input field (1-100).
- **Expected Result**: Count is updated for future generations.
- **Manual Test Time**: 1 second.

## 5. Generate Wallets
- **Description**: User generates new wallets for the selected network.
- **Preconditions**: User is authenticated, network and count selected.
- **Steps**:
  1. Click "Generate Wallets" button.
- **Expected Result**: New wallets appear in the table, count updated.
- **Manual Test Time**: 10-30 seconds (crypto generation, storage).

## 6. View Wallets Table
- **Description**: User views list of generated wallets.
- **Preconditions**: Wallets exist.
- **Steps**:
  1. Observe the table.
- **Expected Result**: Table shows address, network, created date, actions.
- **Manual Test Time**: 2-3 seconds.

## 7. Copy Address
- **Description**: User copies a wallet address to clipboard.
- **Preconditions**: Wallet exists in table.
- **Steps**:
  1. Click "Copy" button next to a wallet.
- **Expected Result**: Address copied to clipboard, alert shown.
- **Manual Test Time**: 2-3 seconds.

## 8. Export Wallet
- **Description**: User exports wallet data (private key, etc.).
- **Preconditions**: Wallet exists.
- **Steps**:
  1. Click "Export" button.
- **Expected Result**: Wallet data copied to clipboard as JSON, alert shown.
- **Manual Test Time**: 2-3 seconds.

## 9. Sign Message
- **Description**: User signs a message with a wallet.
- **Preconditions**: Wallet exists.
- **Steps**:
  1. Click "Sign Msg" button.
  2. Enter message in prompt.
- **Expected Result**: Signature copied to clipboard, alert shown.
- **Manual Test Time**: 5-10 seconds (prompt, signing).

## 10. Sign Transaction
- **Description**: User signs a transaction with a wallet.
- **Preconditions**: Wallet exists.
- **Steps**:
  1. Click "Sign Tx" button.
  2. Enter transaction JSON in prompt.
- **Expected Result**: Signed transaction copied to clipboard, alert shown.
- **Manual Test Time**: 5-10 seconds (prompt, signing).

## 11. Delete Wallet
- **Description**: User deletes a wallet.
- **Preconditions**: Wallet exists.
- **Steps**:
  1. Click "Delete" button.
- **Expected Result**: Wallet removed from table and storage.
- **Manual Test Time**: 2-3 seconds.

## 12. Toggle Theme
- **Description**: User switches between light and dark themes.
- **Preconditions**: Table is visible.
- **Steps**:
  1. Click theme toggle button.
- **Expected Result**: UI theme changes.
- **Manual Test Time**: 1 second.