export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-ink-900 dark:bg-ink-50 flex items-center justify-center mx-auto">
          <span className="text-white dark:text-ink-900 font-serif text-3xl font-bold">E</span>
        </div>
        <h1 className="font-serif text-2xl">Vous êtes hors ligne</h1>
        <p className="text-ink-500 text-sm leading-relaxed">
          Reconnectez-vous à Internet pour accéder à votre journal.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2.5 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900 rounded-full text-sm font-medium"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
