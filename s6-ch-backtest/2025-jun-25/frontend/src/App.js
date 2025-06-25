// ClickHouse Playground Plan (from plan.md)
// 1. Web3 wallet authentication (MetaMask, WalletConnect, Privy)
// 2. Encrypted connection manager for ClickHouse (IndexedDB, CryptoJS, key from wallet signature)
// 3. Connection management: add/edit/remove/select ClickHouse DBs
// 4. Schema management: list/create/edit/drop tables
// 5. Data management: browse/insert/edit/delete records
// 6. Query interface: run SQL, show results
// 7. Security: encrypt sensitive data, validate/sanitize inputs
// 8. Tech: React, Ant Design, ethers.js/web3.js, clickhouse-js/HTTP API
// 9. Milestones: Auth → Encrypted DB → ClickHouse API → UI → Query → Test/Docs
// 10. Future: roles, import/export, visualization, audit logs
//
// TODO: Implement each feature as described above, using the plan as a roadmap.

import React, { useState } from "react";
import { Layout, Typography } from "antd";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setError("");
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (err) {
        setError("Wallet connection rejected.");
      }
    } else {
      setError("MetaMask not detected. Please install MetaMask.");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Title style={{ color: "#fff", margin: 0 }} level={3}>
          ClickHouse Playground
        </Title>
      </Header>
      <Content style={{ padding: 24 }}>
        {/* Web3 Auth, Connection Manager, Schema/Data/Query UI */}
        <div style={{ marginBottom: 24 }}>
          {walletAddress ? (
            <span style={{ color: 'green' }}>Connected: {walletAddress}</span>
          ) : (
            <button style={{ padding: "8px 16px" }} onClick={connectWallet}>
              Connect Web3 Wallet
            </button>
          )}
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>
        <div style={{ marginBottom: 24 }}>
          <strong>Schema Manager:</strong> <em>Coming soon...</em>
        </div>
        <div style={{ marginBottom: 24 }}>
          <strong>Data Viewer:</strong> <em>Coming soon...</em>
        </div>
        <div style={{ marginBottom: 24 }}>
          <strong>Query UI:</strong> <em>Coming soon...</em>
        </div>
        <p>Welcome! Please connect your Web3 wallet to begin.</p>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        ClickHouse Playground ©2025
      </Footer>
    </Layout>
  );
}

export default App;
