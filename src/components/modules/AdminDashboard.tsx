import React, { useState, useEffect } from 'react';
import { ProviderStatus } from '../../types/market';
import { ShieldCheck, Radio, UploadCloud, RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  providerStatus: ProviderStatus | null;
  onRefreshStatus: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ providerStatus, onRefreshStatus }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('DEMO_SIMULATED');
  const [apiKey, setApiKey] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [csvType, setCsvType] = useState('candles');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/users'),
      ]);

      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleManualSyncNow = async () => {
    setSyncInProgress(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/market/sync-nse-now', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setSyncFeedback(json.result?.message || 'Synchronization cycle completed successfully.');
        onRefreshStatus();
        fetchAdminData();
      }
    } catch (err: any) {
      setSyncFeedback('Error syncing: ' + err.message);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, apiKey, proxyUrl }),
      });
      if (res.ok) {
        onRefreshStatus();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;

    try {
      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: csvType, csvContent, symbol: 'NIFTY' }),
      });

      if (res.ok) {
        const json = await res.json();
        setImportStatus(json.message);
        setCsvContent('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">ProfitPulse Terminal Administration & Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage official NSE live website adapters (every 60s minutely cycle during trading hours), residential proxy mirrors, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-num text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="text-slate-300 font-semibold">Daemon Active (60s Update Interval)</span>
        </div>
      </div>

      {/* Grid: Provider Config & CSV Uploader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market Provider Adapter Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              NSE Live Data Web Adapter
            </span>
            <span className="text-[10px] text-emerald-400 font-mono-num">
              {providerStatus?.apiHealth}
            </span>
          </div>

          <form onSubmit={handleUpdateProvider} className="space-y-3">
            <div>
              <label className="text-slate-400 font-medium">Adapter Mode</label>
              <select
                value={selectedMode}
                onChange={e => setSelectedMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none mt-1 font-semibold"
              >
                <option value="OFFICIAL_FEED">NSE Official Website Live Scraper (Direct nseindia.com every 60s)</option>
                <option value="DEMO_SIMULATED">NSE High-Precision Calibrated Simulator (Continuous Micro-Ticks)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Indian Proxy / Relay URL (Optional to bypass Akamai Edge block)</label>
              <input
                type="text"
                placeholder="e.g. http://proxy.in-region.example.com:8080"
                value={proxyUrl}
                onChange={e => setProxyUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none mt-1 font-mono-num"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                If connecting from an overseas cloud runner, specify an Indian proxy to prevent Akamai 403 blocks.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded transition"
              >
                Apply Adapter Settings
              </button>

              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={syncInProgress}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded border border-cyan-800/80 transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncInProgress ? 'animate-spin' : ''}`} />
                <span>{syncInProgress ? 'Syncing...' : 'Trigger NSE Sync Now'}</span>
              </button>
            </div>
          </form>

          {syncFeedback && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800 rounded text-cyan-300 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Current Adapter Status Card */}
          <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800/80 space-y-1 font-mono-num text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Connector:</span>
              <span className="text-slate-200 font-semibold">{providerStatus?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trading Session:</span>
              <span className="text-emerald-400 font-semibold">
                {providerStatus?.tradingHours?.session || '09:15 - 15:30 IST (Mon-Fri)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Refresh Cycle:</span>
              <span className="text-slate-300">Every 60 Seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Successful Sync:</span>
              <span className="text-slate-300">{new Date(providerStatus?.lastSync || '').toLocaleTimeString('en-IN')} IST</span>
            </div>
          </div>
        </div>

        {/* Manual CSV Dataset Ingestion */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Manual CSV Data Import
            </span>
            <span className="text-[10px] text-slate-500">Fail-safe offline mode</span>
          </div>

          <form onSubmit={handleImportCsv} className="space-y-3">
            <div>
              <label className="text-slate-400 font-medium">Dataset Type</label>
              <select
                value={csvType}
                onChange={e => setCsvType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
              >
                <option value="candles">Historical Candlesticks (OHLCV)</option>
                <option value="option_chain">Option Chain Snapshot (Strikes, OI, Vol)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Paste CSV Data</label>
              <textarea
                rows={4}
                placeholder="Date,Open,High,Low,Close,Volume&#10;2026-10-12,24800,24910,24750,24890,140000"
                value={csvContent}
                onChange={e => setCsvContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none mt-1 font-mono-num text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded border border-slate-700 transition"
            >
              Parse & Ingest CSV Records
            </button>
          </form>

          {importStatus && (
            <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-300 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
          <span className="font-semibold text-white">System Security & Daemon Audit Trail</span>
          <span className="text-[10px] text-slate-500 font-mono-num">{auditLogs.length} events logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase text-slate-400 font-semibold">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Initiator</th>
                <th className="py-2 px-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num text-[11px]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN')} IST
                  </td>
                  <td className="py-2 px-3 font-bold text-cyan-400">{log.action}</td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{log.user}</td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
