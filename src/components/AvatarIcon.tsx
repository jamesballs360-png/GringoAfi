export default function AvatarIcon({
  type = "neutral",
  size = 24,
  className = "",
}: {
  type?: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    className,
  };

  if (type === "male") {
    return (
      <svg {...common}>
        <circle cx="20" cy="20" r="20" fill="#E7F0EC" />
        <circle cx="20" cy="16" r="7" fill="#145C4B" />
        <path d="M20 8a7 7 0 0 0-7 7c0 1 3 1.5 7 1.5s7-.5 7-1.5a7 7 0 0 0-7-7z" fill="#0B3A2F" />
        <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#145C4B" />
      </svg>
    );
  }

  if (type === "female") {
    return (
      <svg {...common}>
        <circle cx="20" cy="20" r="20" fill="#F3E6C6" />
        <path d="M12 15a8 8 0 0 1 16 0c0 3-1 6-1 6s.5-3-1-4c-1 3-4 4-7 4s-6-1-7-4c-1.5 1-1 4-1 4s-1-3-1-6z" fill="#A67B2A" />
        <circle cx="20" cy="17" r="6" fill="#C99A3E" />
        <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#A67B2A" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="20" fill="#DCE1DB" />
      <circle cx="20" cy="16" r="7" fill="#5B6660" />
      <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#5B6660" />
    </svg>
  );
}