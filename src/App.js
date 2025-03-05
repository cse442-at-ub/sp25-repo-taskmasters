import { Dayview } from './components/Dayview';

function App() {
  return (
    <div className="App">
      <Dayview selectedDate={new Date()} />
    </div>
  );
}

export default App; 