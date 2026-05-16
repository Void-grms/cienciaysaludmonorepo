import { useState } from 'react'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password })
      })
      const data = await res.json()
      if (data.success || res.ok) {
        alert('Login Referencia exitoso')
      } else {
        setError(data.error?.message || 'Error en login')
      }
    } catch (err) {
      setError('Error de red')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md p-8 bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">LIS Connect</h1>
          <p className="text-slate-400 mt-2 text-sm">Portal para Médicos y Referencias</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Usuario / Email</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dr.perez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] mt-4"
          >
            Acceder a mis pacientes
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
