import { useState, useEffect } from 'react';
import { Search, Syringe, CheckCircle, Clock } from 'lucide-react';

export default function TomaMuestras() {
  const [atenciones, setAtenciones] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchAtenciones = async () => {
    // Filtramos solo las que necesitan muestra
    const res = await fetch(`/api/v1/atenciones?limit=50`, { headers: { 'Authorization': 'Bearer fake' } });
    if (res.ok) {
      const data = await res.json();
      // En una API real, filtraríamos en BD. Para MVP filtramos en cliente.
      setAtenciones((data.data || []).filter((a: any) => a.estado === 'PENDIENTE_MUESTRA'));
    }
  };

  useEffect(() => { fetchAtenciones(); }, []);

  const marcarTomada = async (idAtencion: string, idMuestra: string) => {
    const res = await fetch(`/api/v1/atenciones/${idAtencion}/muestras/${idMuestra}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake' },
      body: JSON.stringify({ estado: 'TOMADA' })
    });
    if (res.ok) {
      alert('Muestra registrada correctamente');
      fetchAtenciones();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Toma de Muestras</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" placeholder="Buscar Orden o Paciente..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {atenciones.map(atencion => (
          <div key={atencion.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{atencion.paciente?.nombres} {atencion.paciente?.apellidos}</p>
                <p className="text-sm text-slate-500">Orden: {atencion.codigo} • Fecha: {new Date(atencion.created_at).toLocaleString()}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3 mr-1" /> Esperando Tubos
              </span>
            </div>
            
            <div className="p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Muestras requeridas para esta orden:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulamos que pedimos el detalle de muestras (En la API real habría que hacer expand o una ruta de muestras pendientes) */}
                {/* Como el GET /atenciones simple no trae muestras, lo simularemos o el usuario deberá abrir la orden */}
                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                      <Syringe className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">SUERO</p>
                      <p className="text-xs text-slate-500 font-mono">{atencion.codigo}-SUERO</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert('Endpoint simulado: Faltaría expandir las muestras en el backend para este botón directo')}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Marcar Tomada
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {atenciones.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-900">Sala de espera vacía</p>
            <p className="text-slate-500">No hay pacientes esperando por toma de muestra.</p>
          </div>
        )}
      </div>
    </div>
  );
}
