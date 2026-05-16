import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ListadoPerfiles() {
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPerfiles = async () => {
      const res = await fetch(`/api/v1/paquetes?search=${search}`, {
        headers: { 'Authorization': `Bearer fake-token-here` }
      });
      if (res.ok) {
        const data = await res.json();
        setPerfiles(data.data || []);
      }
    };
    fetchPerfiles();
  }, [search]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de Servicios</h1>
        <Link to="/catalogo/nuevo" className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Perfil
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center bg-slate-50">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar perfil o examen..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {perfiles.map(perfil => (
            <div key={perfil.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col relative">
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="text-slate-400 hover:text-primary"><Edit className="w-4 h-4" /></button>
                <button className="text-slate-400 hover:text-red-500"><Trash className="w-4 h-4" /></button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 pr-12">{perfil.nombre}</h3>
              <p className="text-2xl font-black text-primary mt-2">S/. {Number(perfil.precio_total).toFixed(2)}</p>
              
              <div className="mt-4 flex-1">
                <p className="text-sm font-medium text-slate-700 mb-2">Exámenes Incluidos ({perfil.detalles?.length || 0}):</p>
                <ul className="text-sm text-slate-600 space-y-1 mb-4">
                  {perfil.detalles?.slice(0, 5).map((d: any) => (
                    <li key={d.id_prueba} className="flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      {d.prueba.descripcion}
                    </li>
                  ))}
                  {perfil.detalles?.length > 5 && (
                    <li className="text-slate-400 italic text-xs">Y {perfil.detalles.length - 5} más...</li>
                  )}
                </ul>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-md">
                  <span className="font-semibold text-slate-700">Nota:</span> {perfil.descripcion || 'Sin requisitos específicos.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
