import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Brew from './pages/Brew'
import AddTea from './pages/AddTea'
import Inventory from './pages/Inventory'
import Menu from './pages/Menu'

const tabClass = ({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')

export default function App() {
  return (
    <HashRouter>
      <header className="site-header">
        <div className="site-header-top">
          <span className="site-name">Doug &amp; George's</span>
          <span className="site-tagline">Brooklyn · Spring 2026</span>
        </div>
        <nav className="nav-tabs">
          <NavLink to="/" end className={tabClass}>
            Brew <span className="nav-tab-num">01</span>
          </NavLink>
          <NavLink to="/menu" className={tabClass}>
            Menu <span className="nav-tab-num">02</span>
          </NavLink>
          <NavLink to="/inventory" className={tabClass}>
            Inventory <span className="nav-tab-num">03</span>
          </NavLink>
          <NavLink to="/add-tea" className={tabClass}>
            Add Tea <span className="nav-tab-num">04</span>
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Brew />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/add-tea" element={<AddTea />} />
      </Routes>
    </HashRouter>
  )
}
