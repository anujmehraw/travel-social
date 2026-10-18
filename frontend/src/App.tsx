
import { useState } from "react";

const navItems = [
  { name: "Community", icon: "🌍" },
  { name: "Notifications", icon: "🔔" },
  { name: "Chats", icon: "💬" },
  { name: "Profile", icon: "👤" },
];

function App() {
  const [activeTab, setActiveTab] = useState("Community");

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <nav className="flex items-center justify-between border-b border-orange-100 bg-white px-8 py-4">
        <h1 className="text-2xl font-bold text-orange-600">
          Travel<span className="text-gray-800">Social</span>
        </h1>

        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === item.name
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-4 text-sm font-bold tracking-widest text-orange-600">
          YOUR NEXT ADVENTURE STARTS HERE
        </p>

        <h2 className="text-5xl font-bold leading-tight">
          The world is better
          <br />
          <span className="text-orange-600">when shared.</span>
        </h2>

        <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
          Meet fellow travelers, discover hidden gems, and
          share the stories behind every journey.
        </p>

        <div className="mt-12 rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-orange-600">
            YOUR TRAVEL COMMUNITY
          </p>

          <h3 className="mt-4 text-2xl font-bold">{activeTab}</h3>

          <p className="mt-2 text-gray-600">
            {activeTab === "Community"
              ? "Find your people, discover places, and plan your next adventure."
              : `Your ${activeTab.toLowerCase()} space will appear here.`}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
