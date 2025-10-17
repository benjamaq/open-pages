export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold mb-2">You’re offline</h1>
        <p className="text-gray-600">We couldn’t reach the server. You can still view pages you’ve already opened. We’ll reconnect when you’re back online.</p>
      </div>
    </main>
  );
}


