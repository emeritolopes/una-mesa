import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Dashboard from './components/dashboard/Dashboard'
import Reservas from './components/reservas/Reservas'
import TPV from './components/tpv/TPV'
import Cocina from './components/cocina/Cocina'
import Personal from './components/personal/Personal'

const NAV = [
  { to: '/',          icon: 'ti-layout-dashboard', label: 'Panel' },
  { to: '/reservas',  icon: 'ti-calendar',          label: 'Reservas' },
  { to: '/tpv',       icon: 'ti-shopping-cart',     label: 'TPV' },
  { to: '/cocina',    icon: 'ti-chef-hat',           label: 'Cocina' },
  { to: '/personal',  icon: 'ti-users',              label: 'Personal' },
]

function Sidebar() {
  return (
    <aside className="w-52 bg-white border-r border-black/7 flex flex-col h-screen flex-shrink-0">
      <div className="px-5 py-5 border-b border-black/7">
        <div className="font-['Syne'] font-black text-xl text-brand tracking-tight">
          una<span className="text-gray-400 font-bold">mesa</span>
        </div>
        <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Gestión de local</div>
      </div>

      <div className="mx-3 my-3 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-bold font-['Syne'] flex-shrink-0">EB</div>
        <div>
          <div className="text-xs font-medium text-gray-900">El Bodegón Central</div>
          <div className="text-[10px] text-gray-400">Restaurante · Madrid</div>
        </div>
      </div>

      <nav className="flex-1 py-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-5 pt-2.5 pb-1">Principal</div>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-5 py-2 text-sm transition-all relative
              ${isActive
                ? 'text-brand font-medium bg-brand/10 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-brand before:rounded-r'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <i className={`ti ${n.icon} text-base opacity-80`} />
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-black/7">
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand">CM</div>
          <div>
            <div className="text-xs font-medium text-gray-900">Carlos M.</div>
            <div className="text-[10px] text-gray-400">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-['DM_Sans']">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/reservas"  element={<Reservas />} />
            <Route path="/tpv"       element={<TPV />} />
            <Route path="/cocina"    element={<Cocina />} />
            <Route path="/personal"  element={<Personal />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
