import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import AuditLogs from './pages/AuditLogs';
import Violations from './pages/Violations';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitor':
        return <LiveMonitor />;
      case 'logs':
        return <AuditLogs />;
      case 'violations':
        return <Violations />;
      case 'agents':
        return <Agents />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <CopilotKit
      runtimeUrl="http://localhost:4000/api/copilotkit"
      publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_API_KEY || "ck_pub_a21c9b4bd5dbd3edd0c9e4edbded8100"}
    >
      <div className="flex flex-col h-screen bg-white">
        
        <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        </div>
      </div>
    </CopilotKit>
  );
}

export default App;