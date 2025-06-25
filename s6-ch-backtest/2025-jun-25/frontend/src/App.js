import React from "react";
import { Layout, Typography } from "antd";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Title style={{ color: "#fff", margin: 0 }} level={3}>
          ClickHouse Playground
        </Title>
      </Header>
      <Content style={{ padding: 24 }}>
        {/* Web3 Auth, Connection Manager, Schema/Data/Query UI */}
        {/* Placeholder components for future implementation */}
        <div style={{ marginBottom: 24 }}>
          <button style={{ padding: "8px 16px" }}>Connect Web3 Wallet</button>
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
