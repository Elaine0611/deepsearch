import "antd/dist/reset.css";
import { App as AntApp, ConfigProvider, theme } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#256ff0",
          colorSuccess: "#18a66e",
          colorWarning: "#d68519",
          colorError: "#d94761",
          colorInfo: "#256ff0",
          colorBgBase: "#f8fbff",
          colorBgLayout: "#f2f8ff",
          colorBgContainer: "#ffffff",
          colorBgElevated: "#ffffff",
          colorBorder: "#d6e5f7",
          colorText: "#12244b",
          colorTextSecondary: "#64789a",
          borderRadius: 8,
          fontFamily:
            "'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
          fontFamilyCode:
            "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
        },
        components: {
          Button: {
            controlHeightLG: 46,
            primaryShadow: "0 8px 20px rgba(37, 111, 240, 0.18)"
          },
          Input: {
            activeBorderColor: "#256ff0",
            hoverBorderColor: "#83b4f4"
          }
        }
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
