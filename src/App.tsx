import { useTone } from './hooks/useTone';

function App() {
  const { isReady, startAudio, playNote } = useTone();

  const handleClick = async () => {
    await startAudio();
    playNote(440);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">TradeSonic</h1>
      <p className="text-gray-400">Real-time trade sonification</p>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
      >
        {isReady ? 'Play Test Tone' : 'Loading...'}
      </button>
    </div>
  );
}

export default App;
