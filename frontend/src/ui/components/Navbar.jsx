import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  // Hide navbar on login gateway pages
  if (pathname === "/" || pathname === "/student-login" || pathname === "/driver") {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">VVCE Bus Tracker</h1>
      <div className="space-x-4">
        <Link to="/map" className="hover:underline">Live Map</Link>
        <Link to="/student-dashboard" className="hover:underline">My Bus</Link>
      </div>
    </nav>
  );
}
