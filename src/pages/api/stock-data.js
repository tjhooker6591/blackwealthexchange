// stock-data.js - Comprehensive API Route with Full Chart Data and Interactive Controls
// Enhanced with zoom, pan, and multiple timeframes, plus improved data values

export default function handler(req, res) {
    const { symbol, timeframe } = req.query;
  
    const fullTimeframeData = {
      '1D': [9.55, 9.57, 9.58, 9.59, 9.60, 9.58, 9.56],
      '5D': [9.45, 9.50, 9.52, 9.54, 9.55, 9.56, 9.56],
      '1M': [9.10, 9.25, 9.35, 9.45, 9.50, 9.55, 9.56],
      '6M': [8.80, 9.00, 9.20, 9.35, 9.45, 9.50, 9.56],
      'YTD': [9.00, 9.10, 9.20, 9.35, 9.45, 9.50, 9.56],
      '1Y': [8.74, 9.00, 9.20, 9.35, 9.50, 9.55, 9.56],
      '5Y': [7.25, 8.00, 8.50, 9.00, 9.20, 9.50, 9.56],
      'MAX': [5.20, 6.00, 7.00, 8.00, 9.00, 9.30, 9.56]
    };
  
    if (symbol === 'RLJ') {
      res.status(200).json({
        latestPrice: 9.56,
        volume: 152300,
        chartOptions: {
          chart: {
            id: 'stock-chart',
            foreColor: '#FFFFFF',
            zoom: { enabled: true },
            toolbar: { show: true, tools: { pan: true, reset: true } }
          },
          xaxis: {
            categories: ['10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
            labels: { style: { colors: '#FFFFFF', fontSize: '12px' } }
          },
          yaxis: {
            labels: { style: { colors: '#FFFFFF', fontSize: '12px' } }
          },
          grid: { borderColor: '#555555' },
          tooltip: { theme: 'dark' }
        },
        series: [{
          name: `Price (USD) - ${timeframe || '1D'}`,
          data: fullTimeframeData[timeframe] || fullTimeframeData['1D']
        }],
        summary: {
          prevClose: 9.55,
          open: 9.60,
          high: 9.65,
          low: 9.50,
          marketCap: '1.47B',
          peRatio: 32.27,
          divYield: '6.04%',
          wkHigh52: 12.39,
          wkLow52: 8.74,
          afterHoursPrice: 9.56,
          afterHoursChange: '0.00 (0.00%)'
        }
      });
    } else {
      res.status(404).json({ error: 'Stock not found' });
    }
  }