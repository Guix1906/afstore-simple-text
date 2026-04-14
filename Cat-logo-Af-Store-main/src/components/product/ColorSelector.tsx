interface ColorSelectorProps {
  colors: { name: string; hex: string }[];
  selected: string;
  onSelect: (color: string) => void;
}

export default function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
        Selecione a Cor
      </span>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => onSelect(color.name)}
            className={`
              w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
              ${selected === color.name ? 'border-brand-gold scale-110' : 'border-transparent'}
            `}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {selected === color.name && (
              <div className={`w-2 h-2 rounded-full ${color.hex === '#FFFFFF' ? 'bg-black' : 'bg-white'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
