interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
}

export default function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-sans font-extrabold uppercase tracking-[0.3em] text-brand-text-muted">
          Selecione o Fit
        </span>
        {selected && (
          <span className="text-[9px] font-sans font-black text-brand-gold uppercase tracking-[0.1em]">
            Size: {selected}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`
              w-12 h-12 flex items-center justify-center rounded-xl border text-[11px] font-sans font-black transition-all duration-500
              ${selected === size 
                ? 'bg-brand-gold border-brand-gold text-black shadow-xl shadow-brand-gold/25 scale-105' 
                : 'bg-black/20 border-brand-border/50 text-brand-text-muted hover:border-brand-gold hover:text-brand-gold'}
            `}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
