import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    // Simulación básica: redirigir según rol ingresado
    if (usuario === 'admin') navigate('/admin')
    else if (usuario === 'doctor') navigate('/doctor')
    else if (usuario === 'secretaria') navigate('/secretaria')
    else alert('Rol inválido')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Iniciar sesión</h2>
      <input
        type="text"
        placeholder="Escribe tu rol: admin, doctor o secretaria"
        onChange={(e) => setUsuario(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  )
}
