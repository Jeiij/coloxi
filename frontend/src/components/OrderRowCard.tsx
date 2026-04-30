import React from 'react';

export interface OrderRowCardProps {
  codigo: string;
  fecha: string;
  creadoPor?: string;
  totalItems: number;
  estadoBadgeClass: string;
  estadoLabel: string;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export default function OrderRowCard({
  codigo,
  fecha,
  creadoPor,
  totalItems,
  estadoBadgeClass,
  estadoLabel,
  actions,
  onClick,
}: OrderRowCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center transition-all hover:shadow-md hover:border-blue-100 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      
      {/* 1. Left Section: Icon + Code + Date (Fixed Width for stability) */}
      <div className="flex items-center gap-4 sm:w-[280px] shrink-0">
        {/* Order Icon Avatar */}
        <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>

        {/* Code + Date */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black font-mono text-gray-900 tracking-wide truncate" title={codigo}>{codigo}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
        </div>
      </div>

      {/* 2. Center Section: Metrics (Using a better grid for perfect vertical alignment) */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 items-center">
        {/* Estado (Now closer to the left) */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado</p>
          <div className="flex">
            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${estadoBadgeClass}`}>
              {estadoLabel}
            </span>
          </div>
        </div>

        {/* Creado Por */}
        <div className="hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Creado por</p>
          <p className="text-sm font-semibold text-gray-700 truncate">{creadoPor || '—'}</p>
        </div>

        {/* Ítems */}
        <div className="text-right sm:text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ítems</p>
          <p className="text-xl font-black text-gray-900 leading-none">
            {totalItems} <span className="text-[10px] font-bold text-gray-400 uppercase">prods</span>
          </p>
        </div>
      </div>

      {/* 3. Right Section: Actions (Fixed Width to anchor everything) */}
      {actions && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 sm:border-l border-gray-100 sm:pl-6 pt-3 sm:pt-0 border-t sm:border-t-0 justify-end sm:w-[220px] shrink-0"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
