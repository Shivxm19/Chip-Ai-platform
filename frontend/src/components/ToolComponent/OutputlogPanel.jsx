// 📁 File: components/RtlEditor/OutputLogPanel.jsx
import React from 'react';

const OutputLogPanel = ({ output }) => {
  return (
    <div className="bg-gray-950 text-green-300 text-sm font-mono p-4 rounded-xl shadow-inner h-48 overflow-y-auto mt-4 border border-purple-900">
      <h3 className="text-purple-400 font-bold mb-2">💬 Output Logs</h3>
      {output ? <pre>{output}</pre> : <p className="text-gray-500">Run simulation to view results here.</p>}
    </div>
  );
};

export default OutputLogPanel;
