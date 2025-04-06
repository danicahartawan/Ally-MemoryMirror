import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Game from "@/pages/game";
import PhotoLibrary from "@/pages/photo-library";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ProfileProvider } from "@/contexts/profile-context";
import { PhotoProvider } from "@/contexts/photo-context";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow px-4 sm:px-6 py-8">
        <div className="container mx-auto max-w-5xl">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/game" component={Game} />
            <Route path="/photos" component={PhotoLibrary} />
            <Route path="/insights" component={Insights} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <PhotoProvider>
          <Router />
          <Toaster />
        </PhotoProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
