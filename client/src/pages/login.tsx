import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useProfileContext } from "@/contexts/profile-context";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { profiles, setSelectedProfile } = useProfileContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter your email and password",
      });
      return;
    }
    
    // For demo, just select the first profile
    if (profiles.length > 0) {
      setSelectedProfile(profiles[0]);
      setLocation("/");
      
      toast({
        title: "Logged in",
        description: `Welcome back, ${profiles[0].name}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "No profiles found. Please sign up first.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f4]">
      {/* Status bar mockup */}
      <div className="flex justify-between items-center p-2 text-sm text-black bg-[#f8f7f4]">
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

      <div className="flex-grow flex flex-col px-6 py-10 items-center">
        {/* Logo */}
        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-8 p-3">
          <img src="/src/assets/logo.png" alt="Memory Mirror Logo" className="w-full h-full" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Login to your account</h1>
        
        <div className="text-sm text-gray-500 mb-8">
          Don't have an account? <button className="text-purple-700 font-semibold" onClick={() => setLocation("/signup")}>Sign Up</button>
        </div>

        <form className="w-full max-w-sm space-y-4" onSubmit={handleLogin}>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 pr-3 py-3 rounded-full bg-white border-gray-200"
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
              className="pl-10 pr-10 py-3 rounded-full bg-white border-gray-200"
            />
            <div 
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-purple-700 text-sm font-medium">
              Forgot Password?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 rounded-full bg-purple-700 hover:bg-purple-800"
          >
            Login
          </Button>
          
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-300 absolute w-full"></div>
            <div className="bg-[#f8f7f4] px-4 relative text-gray-500 text-sm">or</div>
          </div>
          
          <div className="flex justify-between gap-4">
            <button className="flex-1 p-3 rounded-full border border-gray-300 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" fill="#4285F4"/>
                <path d="M12.956 9.51H4.63v3.45h3.782a5.263 5.263 0 0 1-1.391 2.316c-.794.68-1.8 1.082-2.939 1.082a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178" fill="#34A853"/>
                <path d="M7.545 14.339a5.263 5.263 0 0 0 2.478 2.316c.794.68 1.8 1.082 2.939 1.082 4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625l-13.744 7.161z" fill="#FBBC05"/>
                <path d="M12.956 9.51H4.63v3.45h3.782l4.544-3.45z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="flex-1 p-3 rounded-full border border-gray-300 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6575 2H19.658L13.1675 9.874L20.748 20H14.9238L10.2863 14.0515L5.02125 20H2.01875L9.02425 11.5323L1.748 2H7.70525L11.8215 7.38515L16.6575 2ZM15.748 18.2768H17.2063L6.83175 3.6505H5.257L15.748 18.2768Z" fill="black"/>
              </svg>
            </button>
            <button className="flex-1 p-3 rounded-full border border-gray-300 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.402 1.5H18.5V5.5H15.4L15.402 1.5Z" fill="#FF0084"/>
                <path d="M15.402 1.5H8.5V9.5H15.4L15.402 1.5Z" fill="#0063DC"/>
                <path d="M8.5 9.5H1.5V15.5H8.5V9.5Z" fill="#0063DC"/>
                <path d="M8.5 15.5H15.5V22.5H8.5V15.5Z" fill="#0063DC"/>
                <path d="M15.5 9.5H22.5V15.5H15.5V9.5Z" fill="#0063DC"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      <div className="p-4 text-xs text-center text-gray-500 flex justify-center gap-4">
        <span>Terms of use</span>
        <span>|</span>
        <span>Privacy policy</span>
      </div>
    </div>
  );
}