/**
 * Enduser Reports Page
 * Visual revenue and orders analytics using Chart.js
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Calendar, TrendingUp, IndianRupee } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

type Bucket = { _id: any; orders: number; revenue: number };

export default function EnduserReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<'day'|'week'|'month'>('day');
  const [range, setRange] = useState(90);
  const [rows, setRows] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) { router.push('/login'); return; }
    if (session.user.role !== 'enduser') { router.push('/'); return; }
  }, [session, status, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/enduser/reports?groupBy=${groupBy}&range=${range}`);
        const json = await res.json();
        if (json?.success) {
          setRows(json.data || []);
        } else { toast.error('Failed to load reports'); }
      } catch { toast.error('Failed to load reports'); } finally { setLoading(false); }
    };
    load();
  }, [groupBy, range]);

  const labels = useMemo(() => rows.map((r) => {
    if ('d' in r._id) return `${r._id.d}/${r._id.m}/${String(r._id.y).slice(-2)}`;
    if ('w' in r._id) return `W${r._id.w} ${r._id.y}`;
    return `${r._id.m}/${r._id.y}`;
  }), [rows]);

  const revenueData = useMemo(() => ({
    labels,
    datasets: [
      { label: 'Revenue (₹)', data: rows.map(r => r.revenue), backgroundColor: 'rgba(96,64,88,0.35)', borderColor: '#604058', borderWidth: 2 },
    ],
  }), [labels, rows]);

  const ordersData = useMemo(() => ({
    labels,
    datasets: [
      { label: 'Orders', data: rows.map(r => r.orders), backgroundColor: 'rgba(139,90,153,0.35)', borderColor: '#8b5a99', borderWidth: 2 },
    ],
  }), [labels, rows]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-1">Visual analytics of revenue and orders</p>
            </div>
            <div className="flex gap-3">
              <select value={groupBy} onChange={(e)=>setGroupBy(e.target.value as any)} className="border rounded-lg px-3 py-2">
                <option value="day">Group by Day</option>
                <option value="week">Group by Week</option>
                <option value="month">Group by Month</option>
              </select>
              <select value={range} onChange={(e)=>setRange(parseInt(e.target.value))} className="border rounded-lg px-3 py-2">
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <IndianRupee className="w-5 h-5 text-primary-800 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            </div>
            <Bar data={revenueData} options={{ responsive: true, plugins:{ legend:{ display:false } } }} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-primary-800 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            </div>
            <Line data={ordersData} options={{ responsive: true }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-primary-800 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-primary-50">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold">₹ {rows.reduce((s,r)=>s+r.revenue,0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-2xl font-bold">{rows.reduce((s,r)=>s+r.orders,0)}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="text-sm text-gray-600">Data Points</div>
              <div className="text-2xl font-bold">{rows.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


