export const LemonIcon = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 32 32" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Forma principal del limón */}
      <ellipse 
        cx="16" 
        cy="16" 
        rx="12" 
        ry="8" 
        fill="#00F068"
        transform="rotate(-15 16 16)"
      />
      
      {/* Reflejo blanco en la parte superior izquierda */}
      <path 
        d="M8 12 Q12 8 16 10 Q20 12 18 16 Q16 18 12 16 Q8 14 8 12" 
        fill="white" 
        opacity="0.9"
      />
    </svg>
  );
};
