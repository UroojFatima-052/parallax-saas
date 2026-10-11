import { Routes, Route, Navigate } from 'react-router-dom'

function Placeholder({ title }) {
  return (
    <div className="min-h-screen grid place-items-center">
      <h1 className="font-display text-4xl text-teal">{title}</h1>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Placeholder title="Sign in" />} />
      <Route path="/onboard" element={<Placeholder title="Create organisation" />} />
      <Route path="/register" element={<Placeholder title="Join organisation" />} />
      <Route path="/reset-password" element={<Placeholder title="Reset password" />} />
    </Routes>
  )
}

export default App