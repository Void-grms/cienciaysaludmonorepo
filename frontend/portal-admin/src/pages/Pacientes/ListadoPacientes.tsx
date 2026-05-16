import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ListadoPacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPacientes = async () => {
      // Usaremos un token mockeado o manejador real despues
      const res = await fetch(`/api/v1/pacientes?search=${search}`, {
        headers: { 'Authorization': `Bearer fake-token-here` } // Require valid token in reality
      });
      if (res.ok) {
        const data = await res.json();
        setPacientes(data.data || []);
      }
    };
    fetchPacientes();
  }, [search]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
        <Link to="/pacientes/nuevo" className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Paciente
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Documento</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Apellidos y Nombres</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Edad</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay pacientes registrados.</td>
              </tr>
            ) : (
              pacientes.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{p.tipo_doc} {p.nro_doc}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.apellidos}, {p.nombres}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {Math.floor((new Date().getTime() - new Date(p.fecha_nacimiento).getTime()) / 31557600000)} años
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button className="text-primary hover:underline">Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
