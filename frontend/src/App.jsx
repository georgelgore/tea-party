import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Brew from './pages/Brew'
import AddTea from './pages/AddTea'
import Inventory from './pages/Inventory'

const link = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '')

export default function App() {
  return (
    <HashRouter>
      <nav className="nav">
        <span className="nav-title">Doug &amp; George's Tea Party</span>
        <NavLink to="/" end className={link}>Log Brew</NavLink>
        <NavLink to="/inventory" className={link}>Inventory</NavLink>
        <NavLink to="/add-tea" className={link}>Add Tea</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Brew />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/add-tea" element={<AddTea />} />
      </Routes>
    </HashRouter>
  )
}
