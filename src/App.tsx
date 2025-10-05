import {useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface WeatherForecast {
    date: string
    temperatureC: number
    temperatureF: number
    summary: string
}

function App() {
    const [count, setCount] = useState(0)
    const [weatherData, setWeatherData] = useState<WeatherForecast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zipcode, setZipcode] = useState('')

  const fetchWeather = async () => {
    if (!zipcode) {
      setError('Please enter a zipcode')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const url = `https://localhost:7000/WeatherForecast?zipcode=${zipcode}`
      console.log('Fetching from:', url)
      const response = await fetch(url)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      setWeatherData(data)
    } catch (err) {
      console.error('Fetch error:', err)
      
      let errorMessage = 'Failed to fetch weather data. '
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage += 'Network error - Check if backend is running, CORS is enabled, or certificate is trusted. '
      }
      
      if (err instanceof Error) {
        errorMessage += `Details: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <div className="card">
        <h2>Weather Forecast</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Enter zipcode"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #646cff',
              marginRight: '10px'
            }}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? 'Loading...' : 'Get Weather Forecast'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            color: 'red', 
            marginTop: '10px', 
            padding: '10px', 
            border: '1px solid red',
            borderRadius: '4px',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <strong>Error:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>
            <p style={{ marginTop: '10px', fontSize: '12px' }}>
              Check the browser console (F12) for more details.
            </p>
          </div>
        )}
        
        {weatherData.length > 0 && (
          <ul style={{ textAlign: 'left', marginTop: '20px' }}>
            {weatherData.map((forecast, index) => (
              <li key={index}>
                {new Date(forecast.date).toLocaleDateString()}: {forecast.temperatureC}°C - {forecast.summary}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
