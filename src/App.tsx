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
        {transactions?.perMonth || "Loading..."}
      </header>
    </div>
  );
}

export default App;
