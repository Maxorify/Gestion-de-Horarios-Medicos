import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Fake: cambiar por verificación real después
  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario === "admin") {
      navigate("/admin");
    } else if (usuario === "doctor") {
      navigate("/doctor");
    } else if (usuario === "secretaria") {
      navigate("/secretaria");
    } else {
      alert("Usuario no reconocido (usa admin, doctor o secretaria)");
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input 
        type="text" 
        placeholder="Usuario" 
        value={usuario} 
        onChange={e => setUsuario(e.target.value)} 
      /><br/>
      <input 
        type="password" 
        placeholder="Contraseña" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      /><br/>
      <button type="submit">Entrar</button>
    </form>
  );
}
