import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useProfileContext } from "@/contexts/profile-context";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { setSelectedProfile } = useProfileContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name || !email || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a new profile
      const profile = await apiRequest('POST', '/api/profiles', {
        name,
        avatarInitials: name.split(' ').map(n => n[0]).join(''),
        relationship: "self",
        birthYear: new Date().getFullYear() - 30, // Default age
      }, true);
      
      setSelectedProfile(profile);
      setLocation("/");
      
      toast({
        title: "Account created",
        description: `Welcome to Ally AI, ${profile.name}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4ee]">
      {/* Status bar mockup */}
      <div className="flex justify-between items-center p-2 text-sm text-black">
        <div>9:41</div>
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M7 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 12V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="16" height="8" rx="2" fill="currentColor" />
            <path d="M20 10C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14V10Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div className="flex-grow flex flex-col px-6 py-6 items-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 p-3">
          <img src="/src/assets/logo.png" alt="Ally AI Logo" className="w-full h-full" />
        </div>

        <h1 className="text-2xl font-bold mb-1 text-left w-full">Create your account</h1>
        
        <div className="text-sm text-gray-500 mb-6 text-left w-full">
          Already have an account? <button className="text-[#6a2c8e] font-semibold" onClick={() => setLocation("/login")}>Login</button>
        </div>

        <form className="w-full space-y-4" onSubmit={handleSignup}>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <Input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 pr-3 py-5 rounded-full bg-white border-gray-200"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <Input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 pr-3 py-5 rounded-full bg-white border-gray-200"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 10.9999V6.99988C7 4.23845 9.23858 1.99988 12 1.99988C14.7614 1.99988 17 4.23845 17 6.99988V10.9999" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 py-5 rounded-full bg-white border-gray-200"
            />
            <div 
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-[#6a2c8e]" />
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 mt-4 rounded-full bg-[#6a2c8e] hover:bg-[#5a2277]"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </div>

      <div className="flex justify-center border-t border-gray-200 py-4 text-xs text-center text-gray-500 gap-4">
        <span>Terms of use</span>
        <span>|</span>
        <span>Privacy policy</span>
      </div>
    </div>
  );
}