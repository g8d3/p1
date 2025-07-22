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
import { Layout, Typography, Tabs, Form, Input, Button, List, Card } from "antd";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const [connections, setConnections] = useState([]);

  // Connection form state
  const [form] = Form.useForm();

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

  const handleAddConnection = (values) => {
    setConnections([...connections, values]);
    form.resetFields();
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Title style={{ color: "#fff", margin: 0 }} level={3}>
          ClickHouse Playground
        </Title>
      </Header>
      <Content style={{ padding: 24 }}>
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
        {walletAddress && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "connections",
                label: "Connection Manager",
                children: (
                  <Card title="Add ClickHouse Connection" style={{ marginBottom: 24 }}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleAddConnection}
                      style={{ marginBottom: 16, maxWidth: 600 }}
                    >
                      <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name required' }]} hasFeedback>
                        <Input placeholder="Name" />
                      </Form.Item>
                      <Form.Item name="host" label="Host" rules={[{ required: true, message: 'Host required' }]} hasFeedback>
                        <Input placeholder="Host" />
                      </Form.Item>
                      <Form.Item name="port" label="Port" rules={[{ required: true, message: 'Port required' }]} hasFeedback>
                        <Input placeholder="Port" />
                      </Form.Item>
                      <Form.Item name="user" label="User" rules={[{ required: true, message: 'User required' }]} hasFeedback>
                        <Input placeholder="User" />
                      </Form.Item>
                      <Form.Item name="password" label="Password" hasFeedback>
                        <Input.Password placeholder="Password" />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">Add</Button>
                      </Form.Item>
                    </Form>
                    <List
                      header={<b>Saved Connections</b>}
                      bordered
                      dataSource={connections}
                      renderItem={item => (
                        <List.Item>
                          <b>{item.name}</b> ({item.host}:{item.port}, user: {item.user})
                        </List.Item>
                      )}
                      locale={{ emptyText: "No connections added yet." }}
                    />
                  </Card>
                ),
              },
              {
                key: "schema",
                label: "Schema Manager",
                children: <div>Schema Manager: <em>Coming soon...</em></div>,
              },
              {
                key: "data",
                label: "Data Viewer",
                children: <div>Data Viewer: <em>Coming soon...</em></div>,
              },
              {
                key: "query",
                label: "Query UI",
                children: <div>Query UI: <em>Coming soon...</em></div>,
              },
            ]}
          />
        )}
        {!walletAddress && <p>Welcome! Please connect your Web3 wallet to begin.</p>}
      </Content>
      <Footer style={{ textAlign: "center" }}>
        ClickHouse Playground ©2025
      </Footer>
    </Layout>
  );
}

export default App;
