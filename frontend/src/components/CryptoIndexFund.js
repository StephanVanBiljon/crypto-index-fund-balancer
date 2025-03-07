import { useState } from "react";
import "./CryptoIndexFund.css";

const CryptoIndexFund = () => {
  const [assetCap, setAssetCap] = useState("");
  const [totalCapital, setTotalCapital] = useState("");
  const [coins, setCoins] = useState([]);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateInputs = () => {
    if (parseFloat(assetCap) < 0) {
      setError("Asset Cap cannot be negative.");
      return false;
    }
    if (parseFloat(totalCapital) < 0) {
      setError("Total Capital cannot be negative.");
      return false;
    }
    for (const coin of coins) {
      if (parseFloat(coin.marketCap) < 0) {
        setError("Market Cap cannot be negative.");
        return false;
      }
      if (parseFloat(coin.price) < 0) {
        setError("Price cannot be negative.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleAddCoin = () => {
    setCoins([...coins, { symbol: "", marketCap: "", price: "" }]);
  };

  const handleRemoveCoin = (index) => {
    setCoins(coins.filter((_, i) => i !== index));
  };

  const handleCoinChange = (index, field, value) => {
    const updatedCoins = [...coins];
    updatedCoins[index][field] = value;
    setCoins(updatedCoins);
  };

  

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const requestBody = {
        asset_cap: parseFloat(assetCap),
        total_capital: parseFloat(totalCapital),
        coins: coins.map(({ symbol, marketCap, price }) => ({
          symbol,
          market_cap: parseFloat(marketCap),
          price: parseFloat(price),
        })),
      };
    
      const response = await fetch("http://localhost:8000/fund-asset-allocator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error calculating fund allocation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="title">Crypto Index Fund Calculator</h2>

      {error && <div className="error-message" style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      <br/>
      
      <div className="form-group">
        <label className="label">Asset Cap (%):</label>
        <input
          type="number"
          value={assetCap}
          onChange={(e) => setAssetCap(e.target.value)}
          className="input"
          placeholder="Maximum percentage per asset"
        />
      </div>

      <div className="form-group">
        <label className="label">Total Capital (ZAR):</label>
        <input
          type="number"
          value={totalCapital}
          onChange={(e) => setTotalCapital(e.target.value)}
          className="input"
          placeholder="Total investment amount"
        />
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="subtitle">Coins</h3>
          <button onClick={handleAddCoin} className="button button-blue">
            Add Coin
          </button>
        </div>
        
        {coins.length > 0 && (
          <div className="coins-list">
            {coins.map((coin, index) => (
              <div key={index} className="coin-item">
                <input
                  type="text"
                  placeholder="Symbol (e.g. BTC)"
                  value={coin.symbol}
                  onChange={(e) => handleCoinChange(index, "symbol", e.target.value)}
                  className="input coin-input"
                />
                <input
                  type="number"
                  placeholder="Market Cap"
                  value={coin.marketCap}
                  onChange={(e) => handleCoinChange(index, "marketCap", e.target.value)}
                  className="input coin-input"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={coin.price}
                  onChange={(e) => handleCoinChange(index, "price", e.target.value)}
                  className="input coin-input"
                />
                <button 
                  onClick={() => handleRemoveCoin(index)} 
                  className="button button-red"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        
        {coins.length === 0 && (
          <div className="empty-message">
            No coins added yet. Click "Add Coin" to get started.
          </div>
        )}
      </div>

      <div className="form-actions">
        <button 
          onClick={handleSubmit} 
          disabled={isLoading || coins.length === 0 || !assetCap || !totalCapital}
          className={`button button-green ${(isLoading || coins.length === 0 || !assetCap || !totalCapital) ? 'button-disabled' : ''}`}
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {results && (
        <div className="results-section">
          <h3 className="subtitle">Fund Allocations</h3>
          
          <table className="result-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Amount</th>
                <th>ZAR Value</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {results.map((coinData, index) => {
                // Each coinData is an object with a single key (the coin symbol)
                const symbol = Object.keys(coinData)[0];
                // The value is a tuple [amount, total_price, percentage]
                const [amount, totalPrice, percentage] = coinData[symbol];
                
                return (
                  <tr key={index}>
                    <td>{symbol}</td>
                    <td>{amount.toFixed(6)}</td>
                    <td>R {totalPrice.toFixed(2)}</td>
                    <td>{percentage.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CryptoIndexFund;