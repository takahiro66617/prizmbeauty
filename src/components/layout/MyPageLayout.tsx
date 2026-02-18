import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import InfluencerSidebar from "./InfluencerSidebar";
import { Header } from "./Header";

export default function MyPageLayout() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("currentUser");
    if (!user) {
      navigate("/auth/login");
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden">
        <Header />
      </div>
      <InfluencerSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
