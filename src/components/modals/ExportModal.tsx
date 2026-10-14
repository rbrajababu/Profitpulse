import React from 'react';
import { Download, FileText, Table, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSymbol: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, selectedSymbol }) => {
  if (!isOpen) return null;

  const handleDownload = (type: string) => {
    window.location.href = `/api/reports/export-csv?type=${type}&symbol=${selectedSymbol}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Export Financial Data & Reports</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div
            onClick={() => handleDownload('option-chain')}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-200 group-hover:text-cyan-400 transition flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                {selectedSymbol} Option Chain CSV
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Strikes, CE/PE LTP, OI, OI Changes, Volume, IV & Greeks
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>

          <div
            onClick={() => handleDownload('market')}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-200 group-hover:text-cyan-400 transition flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                NSE Market Master Snapshot CSV
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                All benchmark indices and F&O equities with live quotes and day ranges
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>

          <div
            onClick={() => handleDownload('journal')}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded cursor-pointer transition flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-200 group-hover:text-cyan-400 transition flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Trade Journal Execution Log CSV
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Entries, exits, trade directions, realized P&L, win/loss stats
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
          Generated exports include source attribution, exchange session timestamps, and regulatory educational disclaimers.
        </div>
      </div>
    </div>
  );
};
