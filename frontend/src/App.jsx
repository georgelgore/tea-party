import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Brew from './pages/Brew'
import AddTea from './pages/AddTea'

export default function App() {
  return (
    <HashRouter>
      <nav className="nav">
        <span className="nav-title">Doug &amp; George's Tea Party</span>
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Log Brew
        </NavLink>
        <NavLink to="/add-tea" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Add Tea
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Brew />} />
        <Route path="/add-tea" element={<AddTea />} />
      </Routes>
    </HashRouter>
  )
}
