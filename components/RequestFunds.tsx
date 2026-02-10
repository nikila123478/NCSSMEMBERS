import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { DollarSign, Clock } from 'lucide-react';

const RequestFunds: React.FC = () => {
  const { requestExpense, finance, currentUser } = useStore();
  const [expenseForm, setExpenseForm] = useState({ amount: '', project: '', desc: '' });

  const handleSubmit = () => {
    const amount = parseFloat(expenseForm.amount);
    if (!amount || !expenseForm.project || !expenseForm.desc) {
      alert("Please fill all fields.");
      return;
    }
    
    requestExpense(
      amount, 
      expenseForm.project, 
      expenseForm.desc, 
      new Date().toISOString()
    );
    
    setExpenseForm({ amount: '', project: '', desc: '' });
    alert("Request submitted successfully!");
  };

  // Filter requests for the current user
  const myRequests = finance.requests.filter(r => r.requesterId === currentUser?.id);

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
           <h2 className="text-3xl font-black text-gray-900">Request Funding</h2>
           <p className="text-gray-500">Submit expense proposals for project approval.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            {/* REQUEST FORM */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 bg-black text-white rounded-lg"><DollarSign className="w-5 h-5"/></div>
                    New Request
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Name</label>
                        <input 
                            type="text" 
                            value={expenseForm.project}
                            onChange={e => setExpenseForm({...expenseForm, project: e.target.value})}
                            placeholder="e.g. Science Fair Materials" 
                            className="w-full p-3 bg-gray-50 rounded border border-gray-200 focus:border-red-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (LKR)</label>
                        <input 
                            type="number" 
                            value={expenseForm.amount}
                            onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                            placeholder="0.00" 
                            className="w-full p-3 bg-gray-50 rounded border border-gray-200 focus:border-red-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Description</label>
                        <textarea 
                            value={expenseForm.desc}
                            onChange={e => setExpenseForm({...expenseForm, desc: e.target.value})}
                            placeholder="Detailed explanation of costs..." 
                            rows={4}
                            className="w-full p-3 bg-gray-50 rounded border border-gray-200 focus:border-red-500 outline-none" 
                        />
                    </div>
                    
                    <button 
                        onClick={handleSubmit}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                    >
                        Submit Request
                    </button>
                </div>
            </div>

            {/* MY REQUESTS HISTORY */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400"/> My History
                </h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {myRequests.length === 0 && (
                        <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <p>No past requests.</p>
                        </div>
                    )}
                    {myRequests.map(req => (
                        <div key={req.id} className="p-5 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 text-xs font-black rounded uppercase tracking-wider
                                    ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                                      req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {req.status}
                                </span>
                                <span className="font-black text-lg text-gray-900">{formatCurrency(req.amount)}</span>
                            </div>
                            <h4 className="font-bold text-gray-800">{req.projectName}</h4>
                            <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                            <p className="text-xs text-gray-400 font-medium">{new Date(req.date).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default RequestFunds;