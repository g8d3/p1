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
        {/* TODO: Add Web3 Auth, Connection Manager, Schema/Data/Query UI */}
        <p>Welcome! Please connect your Web3 wallet to begin.</p>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        ClickHouse Playground ©2025
      </Footer>
    </Layout>
  );
}

export default App;
