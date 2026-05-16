import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ListadoAtenciones() {
  const [atenciones, setAtenciones] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/atenciones', { headers: { 'Authorization': 'Bearer fake' } })
      .then(res => res.json())
      .then(data => setAtenciones(data.data || []));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Registro de Órdenes</h1>
        <Link to="/recepcion/nueva" className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Atención
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Código</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Paciente</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Fecha</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Estado Muestras</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {atenciones.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{a.codigo}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <span className="block font-medium">{a.paciente?.nombres} {a.paciente?.apellidos}</span>
                  <span className="text-xs text-slate-500">{a.paciente?.nro_doc}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {a.estado === 'PENDIENTE_MUESTRA' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3 mr-1" /> Faltan Muestras
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Completas
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">S/. {Number(a.total).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <button className="text-primary hover:text-primary/80"><FileText className="w-5 h-5 ml-auto" /></button>
                </td>
              </tr>
            ))}
            {atenciones.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay atenciones registradas hoy.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
