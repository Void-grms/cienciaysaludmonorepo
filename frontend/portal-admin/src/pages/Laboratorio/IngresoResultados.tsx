import { useState, useEffect } from 'react';
import { Search, TestTube, CheckCircle, Save } from 'lucide-react';

export default function IngresoResultados() {
  const [atenciones, setAtenciones] = useState<any[]>([]);
  const [selectedAtencion, setSelectedAtencion] = useState<any>(null);
  const [resultados, setResultados] = useState<Record<string, string>>({});

  const fetchAtenciones = async () => {
    // Filtramos las EN_PROCESO
    const res = await fetch(`/api/v1/atenciones?limit=50`, { headers: { 'Authorization': 'Bearer fake' } });
    if (res.ok) {
      const data = await res.json();
      setAtenciones((data.data || []).filter((a: any) => a.estado === 'EN_PROCESO'));
    }
  };

  useEffect(() => { fetchAtenciones(); }, []);

  const abrirAtencion = async (id: string) => {
    const res = await fetch(`/api/v1/atenciones/${id}`, { headers: { 'Authorization': 'Bearer fake' } });
    if (res.ok) {
      const data = await res.json();
      setSelectedAtencion(data);
      // Precargar resultados si ya existen
      const iniRes: Record<string, string> = {};
      data.detalles.forEach((d: any) => { if(d.resultado) iniRes[d.id] = d.resultado; });
      setResultados(iniRes);
    }
  };

  const guardarResultados = async () => {
    const payload = {
      resultados: Object.keys(resultados).map(id_detalle => ({
        id_detalle,
        resultado: resultados[id_detalle]
      }))
    };

    if(payload.resultados.length === 0) return alert('No hay resultados que guardar');

    const res = await fetch(`/api/v1/atenciones/${selectedAtencion.id}/resultados`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Resultados guardados correctamente');
      setSelectedAtencion(null);
      fetchAtenciones();
    }
  };

  if (selectedAtencion) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ingreso Analítico</h1>
            <p className="text-slate-500">Orden: {selectedAtencion.codigo} • Paciente: {selectedAtencion.paciente.nombres}</p>
          </div>
          <button onClick={() => setSelectedAtencion(null)} className="text-slate-500 hover:text-slate-700">Cerrar</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 w-1/2">Examen Solicitado</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {selectedAtencion.detalles.map((d: any) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{d.prueba.descripcion}</p>
                    <p className="text-xs text-slate-500">{d.prueba.area}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      placeholder="Ej: 110 mg/dL"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-slate-900"
                      value={resultados[d.id] || ''}
                      onChange={(e) => setResultados({...resultados, [d.id]: e.target.value})}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={guardarResultados}
              className="flex items-center px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              Guardar Resultados
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bandeja de Procesamiento</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atenciones.map(atencion => (
          <div key={atencion.id} onClick={() => abrirAtencion(atencion.id)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TestTube className="w-5 h-5 text-blue-600" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                EN PROCESO
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{atencion.codigo}</h3>
            <p className="text-slate-600 mb-1">{atencion.paciente?.nombres} {atencion.paciente?.apellidos}</p>
            <p className="text-xs text-slate-400">Hace 2 horas</p>
          </div>
        ))}

        {atenciones.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-900">Bandeja al día</p>
            <p className="text-slate-500">No hay muestras esperando procesamiento analítico.</p>
          </div>
        )}
      </div>
    </div>
  );
}
