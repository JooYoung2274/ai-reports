import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { UserDetail } from './pages/UserDetail';
import { PromptHistory } from './pages/PromptHistory';
import { TokenUsage } from './pages/TokenUsage';

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/users" element={<UserDetail />} />
            <Route path="/prompts" element={<PromptHistory />} />
            <Route path="/tokens" element={<TokenUsage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
