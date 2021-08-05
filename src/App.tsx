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

interface UpTransaction {
  id: string;
  attributes: {
    amount: { value: string };
    description: string;
    message: string;
  };
}

function useGet<T>(url: string): T | undefined {
  const [data, setData] = useState<T>();
  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData);
  }, [url]);
  return data;
}

function App() {
  const transactions = useGet<TransactionsResponse>("/api/transactions");
  const ups = useGet<UpTransaction[]>("/api/up");

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
      <ul>
        {ups
          ? ups.map((up) => (
              <li key={up.id}>
                {up.attributes.description} -&gt; {up.attributes.message} -&gt; {up.attributes.amount.value}
              </li>
            ))
          : "Loading..."}
      </ul>
    </div>
  );
}

export default App;
