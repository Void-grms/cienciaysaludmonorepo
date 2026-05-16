import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Settings, LogOut, LayoutDashboard, Stethoscope, ClipboardList, Syringe, TestTube } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token logic here
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-primary">LIS Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </Link>
          <Link to="/recepcion" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <ClipboardList className="w-5 h-5 mr-3" />
            <span>Recepción (Órdenes)</span>
          </Link>
          <div className="pt-4 mt-2 border-t border-slate-200">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Laboratorio Clínico</p>
            <Link to="/laboratorio/muestras" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              <Syringe className="w-5 h-5 mr-3" />
              <span>Toma de Muestras</span>
            </Link>
            <Link to="/laboratorio/resultados" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              <TestTube className="w-5 h-5 mr-3" />
              <span>Ingreso de Resultados</span>
            </Link>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-200">
            <Link to="/pacientes" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <Users className="w-5 h-5 mr-3" />
            <span>Pacientes</span>
          </Link>
          <Link to="/referencias" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <FileText className="w-5 h-5 mr-3" />
            <span>Referencias</span>
          </Link>
          <Link to="/catalogo" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <Stethoscope className="w-5 h-5 mr-3" />
            <span>Catálogo</span>
          </Link>
          <Link to="/configuracion" className="flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            <span>Configuración</span>
          </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
