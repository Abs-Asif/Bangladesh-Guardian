import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl md:text-2xl font-medium max-w-md mx-auto leading-relaxed">
          You have Entered into a Wrong URL. We are sending you back. Stay calm.
        </p>
        <div className="relative pt-4">
          <div className="text-4xl font-mono font-bold text-primary animate-pulse">
            {countdown}
          </div>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Redirecting to Home</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
