import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { getTrends, getMargins, getGrossVsNet, getDashboardMetrics } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import './FinancialAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const FinancialAnalytics = () => {
  const { shopId } = useParams();
  const [trends, setTrends] = useState([]);
  const [margins, setMargins] = useState([]);
  const [grossVsNet, setGrossVsNet] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [shopId, period]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [trendsRes, marginsRes, grossVsNetRes, metricsRes] = await Promise.all([
        getTrends(shopId, period),
        getMargins(shopId),
        getGrossVsNet(shopId),
        getDashboardMetrics(shopId)
      ]);
      setTrends(trendsRes.data);
      setMargins(marginsRes.data);
      setGrossVsNet(grossVsNetRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue/Profit Trends Chart Data
  const trendsData = {
    labels: trends.map(t => t.period),
    datasets: [
      {
        label: 'Revenue',
        data: trends.map(t => parseFloat(t.revenue)),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.1
      },
      {
        label: 'Profit',
        data: trends.map(t => parseFloat(t.profit)),
        borderColor: 'rgb(40, 167, 69)',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.1
      }
    ]
  };

  // Profit Margins Chart Data
  const topMargins = [...margins]
    .sort((a, b) => parseFloat(b.totalProfit) - parseFloat(a.totalProfit))
    .slice(0, 10);

  const marginsData = {
    labels: topMargins.map(m => m.productName),
    datasets: [
      {
        label: 'Profit Margin %',
        data: topMargins.map(m => parseFloat(m.profitMargin)),
        backgroundColor: 'rgba(102, 126, 234, 0.8)'
      }
    ]
  };

  // Gross vs Net Profit Chart
  const profitComparisonData = grossVsNet ? {
    labels: ['Gross Profit', 'Net Profit'],
    datasets: [
      {
        label: 'Amount',
        data: [
          parseFloat(grossVsNet.grossProfit),
          parseFloat(grossVsNet.netProfit)
        ],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(40, 167, 69, 0.8)'
        ]
      }
    ]
  } : null;

  return (
    <UserLayout activeTab="analytics">
      <div className="financial-analytics">
        <div className="page-header-section">
          <h2>Financial Analytics</h2>
          <div className="period-selector">
            <label>Period: </label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <p className="summary-value">₱{grossVsNet ? parseFloat(grossVsNet.grossRevenue).toFixed(2) : '0.00'}</p>
              </div>
              <div className="summary-card">
                <h3>Gross Profit</h3>
                <p className="summary-value profit">₱{grossVsNet ? parseFloat(grossVsNet.grossProfit).toFixed(2) : '0.00'}</p>
              </div>
              <div className="summary-card">
                <h3>Net Profit</h3>
                <p className="summary-value profit">₱{grossVsNet ? parseFloat(grossVsNet.netProfit).toFixed(2) : '0.00'}</p>
              </div>
              <div className="summary-card">
                <h3>Profit Margin</h3>
                <p className="summary-value">{grossVsNet ? parseFloat(grossVsNet.profitMargin).toFixed(2) : '0.00'}%</p>
              </div>
            </div>

            {/* Revenue/Profit Trends Chart */}
            <div className="chart-card">
              <h3>Revenue & Profit Trends ({period})</h3>
              {trends.length > 0 ? (
                <Line data={trendsData} options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} />
              ) : (
                <p className="no-data">No data available for the selected period</p>
              )}
            </div>

            <div className="charts-grid">
              {/* Gross vs Net Profit */}
              {profitComparisonData && (
                <div className="chart-card">
                  <h3>Gross vs Net Profit</h3>
                  <Bar data={profitComparisonData} options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} />
                  <div className="chart-details">
                    <p><strong>Total Revenue:</strong> ₱{grossVsNet ? parseFloat(grossVsNet.grossRevenue).toFixed(2) : '0.00'}</p>
                    <p><strong>Total Cost:</strong> ₱{grossVsNet ? parseFloat(grossVsNet.totalCost).toFixed(2) : '0.00'}</p>
                    <p><strong>Total Expenses:</strong> ₱{grossVsNet ? parseFloat(grossVsNet.totalExpenses).toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              )}

              {/* Top Products by Profit Margin */}
              <div className="chart-card">
                <h3>Top Products by Profit</h3>
                {topMargins.length > 0 ? (
                  <Bar data={marginsData} options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} />
                ) : (
                  <p className="no-data">No sales data available</p>
                )}
              </div>
            </div>

            {/* Profit Margins Table */}
            <div className="margins-table-card">
              <h3>Product Profit Margins</h3>
              {margins.length > 0 ? (
                <div className="table-container">
                  <table className="margins-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Cost Price</th>
                        <th>Selling Price</th>
                        <th>Profit Margin %</th>
                        <th>Total Sold</th>
                        <th>Total Revenue</th>
                        <th>Total Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {margins.map(margin => (
                        <tr key={margin.productId}>
                          <td>{margin.productName}</td>
                          <td>₱{margin.costPrice}</td>
                          <td>₱{margin.sellingPrice}</td>
                          <td className={parseFloat(margin.profitMargin) > 30 ? 'good-margin' : parseFloat(margin.profitMargin) > 10 ? 'ok-margin' : 'low-margin'}>
                            {margin.profitMargin}%
                          </td>
                          <td>{margin.totalSold}</td>
                          <td>₱{margin.totalRevenue}</td>
                          <td className="profit-cell">₱{margin.totalProfit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No product margins data available</p>
              )}
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default FinancialAnalytics;
