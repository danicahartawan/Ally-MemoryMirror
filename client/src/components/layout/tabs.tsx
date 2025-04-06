import { useLocation } from "wouter";

type TabsProps = {
  active: "game" | "photos" | "insights" | "settings";
};

export default function Tabs({ active }: TabsProps) {
  const [_, navigate] = useLocation();

  const tabs = [
    {
      id: "game",
      label: "Memory Games",
      icon: "fas fa-gamepad",
      path: "/game"
    },
    {
      id: "photos",
      label: "Photo Library",
      icon: "fas fa-images",
      path: "/photos"
    },
    {
      id: "insights",
      label: "Insights",
      icon: "fas fa-chart-line",
      path: "/insights"
    },
    {
      id: "settings",
      label: "Settings",
      icon: "fas fa-cog",
      path: "/settings"
    }
  ];
  
  return (
    <div className="mb-8 border-b border-neutral-light">
      <div className="flex flex-wrap -mb-px text-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`mr-8 py-3 border-b-2 focus-visible focus:outline-none focus:ring-2 focus:ring-primary rounded-t-md ${
              active === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent hover:text-primary"
            }`}
            aria-selected={active === tab.id}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
