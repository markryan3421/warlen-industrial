// ─── Keyframes ────────────────────────────────────────────────────────────────
export const KEYFRAMES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.4; }
    80%  { transform: scale(1.7); opacity: 0;   }
    100% { transform: scale(1.7); opacity: 0;   }
  }
`;