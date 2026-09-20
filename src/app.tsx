import { MetaProvider, Title, Meta } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { InvestingAgent } from "~/components/agent/InvestingAgent";
import { SettingsModal } from "~/components/settings/SettingsModal";
import { closeSettings, settingsOpenSignal } from "~/lib/settings-store";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Investing OS</Title>
          <Meta
            name="description"
            content="Investment research, setup tracking, market signals, and agent-assisted analysis."
          />
          <Suspense>{props.children}</Suspense>
          <SettingsModal open={settingsOpenSignal()} onClose={closeSettings} />
          <InvestingAgent />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
