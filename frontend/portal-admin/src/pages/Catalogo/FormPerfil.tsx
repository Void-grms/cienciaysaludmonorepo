import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

export default function FormPerfil() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [pruebas, setPruebas] = useState<any[]>([]);
  const [selectedPruebas, setSelectedPruebas] = useState<string[]>([]);

  useEffect(() => {
    // Cargar pruebas individuales
    fetch('/api/v1/pruebas?limit=100', { headers: { 'Authorization': `Bearer fake` } })
      .then(res => res.json())
      .then(data => setPruebas(data.data || []));
  }, []);

  const togglePrueba = (id: string) => {
    setSelectedPruebas(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: any) => {
    if (selectedPruebas.length === 0) {
      alert('Debe seleccionar al menos un examen');
      return;
    }

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio_total: Number(data.precio_total),
      pruebas_ids: selectedPruebas
    };

    const res = await fetch('/api/v1/paquetes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer fake` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Perfil creado exitosamente');
      navigate('/catalogo');
    } else {
      const err = await res.json();
      alert(err.error?.message || 'Error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Crear Nuevo Perfil / Paquete</h1>
        <button onClick={() => navigate('/catalogo')} className="text-slate-500 hover:text-slate-700">Volver</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form id="perfilForm" onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Perfil</label>
              <input 
                {...register('nombre', { required: true })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ej. Perfil Ejecutivo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Total (S/.)</label>
              <input 
                type="number" step="0.01"
                {...register('precio_total', { required: true, min: 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-xl font-bold text-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Requisitos / Notas</label>
              <textarea 
                {...register('descripcion')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="Ej. Ayuno de 8 horas."
              />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-2">Exámenes seleccionados: <span className="text-primary font-bold">{selectedPruebas.length}</span></p>
              <button 
                type="submit" form="perfilForm"
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                Guardar Perfil
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Seleccionar Exámenes</h2>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {pruebas.map(p => {
              const isSelected = selectedPruebas.includes(p.id);
              return (
                <div 
                  key={p.id}
                  onClick={() => togglePrueba(p.id)}
                  className={`cursor-pointer p-3 rounded-lg border flex items-start transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}
                >
                  <div className={`w-5 h-5 rounded border mt-0.5 mr-3 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{p.descripcion}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.codigo} • {p.tipo_muestra}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
