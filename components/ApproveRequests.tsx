import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { Check, X, CheckSquare, AlertTriangle } from 'lucide-react';

const ApproveRequests: React.FC = () => {
  const { finance, processRequest } = useStore();
  
  const pendingRequests = finance.requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-8 animate-fade-in">
         <div>
           <h2 className="text-3xl font-black text-gray-900">Approve Requests</h2>
           <p className="text-gray-500">Review and authorize pending expense claims.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CheckSquare className="w-5 h-5"/></div>
                <h3 className="text-xl font-bold">Pending Approvals Queue</h3>
                <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    {pendingRequests.length} Pending
                </span>
            </div>

            <div className="space-y-4">
                {pendingRequests.length === 0 && (
                     <div className="py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                        <p>All caught up! No pending requests.</p>
                    </div>
                )}

                {pendingRequests.map(req => (
                    <div key={req.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h4 className="font-black text-lg text-gray-900">{req.projectName}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Requested by</span>
                                    <span className="font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">{req.requesterName}</span>
                                    <span>on {new Date(req.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-black text-2xl text-gray-900">{formatCurrency(req.amount)}</span>
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">Awaiting Action</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-100 text-gray-600 text-sm mb-6 leading-relaxed">
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Reason</span>
                            {req.description}
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => processRequest(req.id, true)} 
                                className="flex-1 py-3 bg-green-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                            >
                                <Check className="w-4 h-4"/> Approve & Transfer
                            </button>
                            <button 
                                onClick={() => processRequest(req.id, false)} 
                                className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-red-50 transition-colors"
                            >
                                <X className="w-4 h-4"/> Reject Request
                            </button>
                        </div>
                        
                        {/* Transaction Warning */}
                        {finance.balance < req.amount && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Warning: Insufficient treasury balance for this transaction. Approval will fail.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ApproveRequests;