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

function App() {
  const [transactions, setTransactions] =
    useState<TransactionsResponse | null>();
  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions);
  }, []);

  console.log(transactions);

  return (
    <div className="App">
      <header className="App-header">
        Charge per month
      </header>
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
