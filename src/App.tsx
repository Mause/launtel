import React from "react";
import { useEffect, useState } from "react";
import "./App.css";

interface TransactionsResponse {
  perMonth: Record<
    string,
    {
      discounted: number;
    }
  >;
}

function get<T>(url: string): T | null {
  const [data, setData] = useState<T | null>();
  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData);
  }, [url]);
  return data;
}

function App() {
  const transactions = get("/api/transactions");

  console.log(transactions);

  return (
    <div className="App">
      <header className="App-header">Charge per month</header>
      <ul>
        {transactions
          ? Object.entries(transactions.perMonth).map(([key, value]) => (
              <li key={key}>
                {key} - ${value.discounted}
              </li>
            ))
          : "Loading..."}
      </ul>
    </div>
  );
}

export default App;
