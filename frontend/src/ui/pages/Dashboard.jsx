export default function Dashboard() {
  const buses = ["Bus 1", "Bus 2", "Bus 3"];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Student Dashboard</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {buses.map((bus) => (
          <div key={bus} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{bus}</h3>
            <p className="text-sm text-gray-600">Status: On Route</p>
          </div>
        ))}
      </div>
    </div>
  );
}
