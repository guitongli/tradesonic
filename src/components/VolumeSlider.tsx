interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (db: number) => void;
  accentColor: string;
}

export function VolumeSlider({
  label,
  value,
  onChange,
  accentColor,
}: VolumeSliderProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={-40}
        max={0}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accentColor} ${((value + 40) / 40) * 100}%, #374151 ${((value + 40) / 40) * 100}%)`,
        }}
      />
      <span className="text-xs text-gray-500 w-10 text-right font-mono">
        {value} dB
      </span>
    </div>
  );
}
