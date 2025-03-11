"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Ensure necessary dependencies are installed:
// npm install react-apexcharts apexcharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

export default function RLJLodgingTrust() {
  const [stockData, setStockData] = useState(null)
  const [error, setError] = useState(null)
  const timeRanges = [
    { label: "1D", value: "1d" },
    { label: "5D", value: "5d" },
    { label: "1M", value: "1mo" },
    { label: "6M", value: "6mo" },
    { label: "YTD", value: "ytd" },
    { label: "1Y", value: "1y" },
    { label: "5Y", value: "5y" },
    { label: "MAX", value: "max" },
  ]
  const [selectedRange, setSelectedRange] = useState("1y")

  // Function to fetch stock data
  async function fetchStockData(range = "1y") {
    try {
      const response = await fetch(`/api/stock-data?symbol=RLJ&range=${range}&interval=1d`)
      if (!response.ok) {
        console.error("API response failed:", response.status, response.statusText)
        throw new Error("Error fetching stock data")
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        const processedData = data.series
          .map((item) => ({
            x: new Date(item.date).getTime(),
            y: [Number(item.open), Number(item.high), Number(item.low), Number(item.close)],
          }))
          .filter((item) => !isNaN(item.x) && item.y.every((val) => !isNaN(val)))

        console.log("Processed data:", processedData) // For debugging

        setStockData({
          chartOptions: {
            chart: {
              id: "stock-chart",
              type: "candlestick",
              height: 350,
              foreColor: "#FFFFFF",
              zoom: { enabled: true },
              toolbar: { show: true },
            },
            xaxis: {
              type: "datetime",
              labels: {
                style: { colors: "#FFFFFF", fontSize: "12px" },
              },
            },
            yaxis: {
              tooltip: {
                enabled: true,
              },
              labels: {
                style: { colors: "#FFFFFF", fontSize: "12px" },
              },
            },
            grid: { borderColor: "#555555" },
            tooltip: { theme: "dark" },
          },
          series: [
            {
              data: processedData,
            },
          ],
          latestPrice: data.latestPrice,
          volume: data.volume,
          marketCap: data.summary.marketCap,
          peRatio: data.summary.peRatio,
          dividendYield: data.summary.divYield,
          fiftyTwoWeekHigh: data.summary.wkHigh52,
          fiftyTwoWeekLow: data.summary.wkLow52,
          afterHoursPrice: data.summary.afterHoursPrice,
          afterHoursChange: data.summary.afterHoursChange,
        })
      }
    } catch (err) {
      console.error("Error loading stock data:", err.message)
      setError("Error loading stock data. Please check the API or internet connection.")
    }
  }

  // Fetch data on mount and set interval for real-time updates
  useEffect(() => {
    fetchStockData(selectedRange)
    const intervalId = setInterval(() => fetchStockData(selectedRange), 60000)

    return () => clearInterval(intervalId)
  }, [selectedRange]) // Removed fetchStockData from dependencies

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg border border-gold">
        <Link href="/stocks" passHref>
          <button className="mb-6 px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
            ← Back to Stocks
          </button>
        </Link>

        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gold">RLJ Lodging Trust (RLJ)</h1>
        </header>

        {/* Stock Price & Status */}
        <section className="mb-8 text-center">
          <h2 className="text-5xl font-bold text-gold">{stockData ? `$${stockData.latestPrice}` : "Loading..."}</h2>
          <div className="flex justify-center items-center mt-2">
            <span
              className={`text-lg ${stockData && stockData.latestPrice > 9.55 ? "text-green-400" : "text-red-400"}`}
            >
              {stockData && stockData.latestPrice > 9.55 ? "↑" : "↓"}{" "}
              {stockData ? `+${(stockData.latestPrice - 9.55).toFixed(2)}` : "0.00"}
            </span>
          </div>
          <p className="text-sm mt-2 text-gray-300">
            {stockData ? `After Hours: $${stockData.afterHoursPrice} (${stockData.afterHoursChange})` : ""}
            <br />
            <span className="text-xs">
              {stockData ? `Closed: Feb 14, 4:06 PM UTC-5 · USD · NYSE · Disclaimer` : ""}
            </span>
          </p>
        </section>

        {/* Time Range Buttons */}
        <section className="mb-8 text-center">
          <div className="flex justify-center space-x-4">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                className={`px-4 py-2 ${
                  selectedRange === range.value ? "bg-gold text-black" : "bg-gray-700 text-white"
                } rounded hover:bg-gray-600`}
                onClick={() => setSelectedRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </section>

        {/* Performance Overview */}
        <section className="mb-8">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : stockData ? (
            <div className="mt-4 bg-gray-700 border border-gold rounded p-4">
              <Chart options={stockData.chartOptions} series={stockData.series} type="candlestick" height={350} />
              <div className="mt-4">
                <p className="text-sm">
                  Stock Price: ${stockData.latestPrice} | Volume: {stockData.volume}
                </p>
              </div>
              <div className="text-sm text-gray-300 mt-4">
                <p>Market Cap: {stockData.marketCap}</p>
                <p>P/E Ratio: {stockData.peRatio}</p>
                <p>Dividend Yield: {stockData.dividendYield}</p>
                <p>52-week High: ${stockData.fiftyTwoWeekHigh}</p>
                <p>52-week Low: ${stockData.fiftyTwoWeekLow}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-yellow-400">Loading stock performance data...</p>
          )}
        </section>

        {/* Impact Stories */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gold">Impact Stories</h2>
          <ul className="mt-4 list-disc list-inside text-gray-300">
            <li>Investing in local minority-owned suppliers.</li>
            <li>Funding scholarships for underrepresented students.</li>
            <li>Promoting diversity within leadership roles.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

