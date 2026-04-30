import React from 'react';

export interface ProductRowTag {
  label: string;
  colorClass: string; // e.g. "bg-green-100 text-green-800"
}

export interface ProductRowMetric {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  valueClass?: string; // e.g. "text-emerald-600 font-bold"
}

export interface ProductRowCardProps {
  image?: string | null;
  code: string;
  name: string;
  tags?: ProductRowTag[];
  metrics: ProductRowMetric[];
  actions?: React.ReactNode;
  dimmed?: boolean; // If true, applies opacity/grayscale to indicate inactive
}

export default function ProductRowCard({
  image,
  code,
  name,
  tags = [],
  metrics,
  actions,
  dimmed = false,
}: ProductRowCardProps) {
  return (
    <div className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row gap-6 transition-all duration-500 hover:shadow-xl hover:shadow-black/[0.03] hover:border-blue-100 group ${dimmed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      
      {/* 1. Left Section: Image + Info */}
      <div className="flex items-center gap-5 sm:w-1/3 min-w-[280px]">
        {/* Avatar */}
        <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <span className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity">📦</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Name, Code, Tags */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono font-black text-blue-600 mb-1 uppercase tracking-widest">{code}</span>
          <h3 className={`text-base font-black tracking-tight truncate ${dimmed ? 'text-gray-500 line-through' : 'text-gray-900'}`} title={name}>
            {name}
          </h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, idx) => (
                <span key={idx} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${tag.colorClass}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Section: Metrics Grid */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex flex-col justify-center border-l-2 border-transparent hover:border-gray-100 pl-4 transition-colors">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5 truncate group-hover:text-gray-400 transition-colors">{metric.label}</span>
            <span className={`text-sm font-black truncate tracking-tight ${metric.valueClass || 'text-gray-800'}`}>
              {metric.value}
            </span>
            {metric.subValue && (
              <span className="text-[10px] font-bold text-gray-400 mt-1 truncate uppercase tracking-tighter">{metric.subValue}</span>
            )}
          </div>
        ))}
      </div>

      {/* 3. Right Section: Actions */}
      {actions && (
        <div className="flex items-center justify-end sm:border-l border-gray-50 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 mt-4 sm:mt-0">
          <div className="transform transition-transform group-hover:translate-x-1 duration-300">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}
