interface Props {
  children: React.ReactNode;
}

export default function AuthCard({ children }: Props) {
  return (
    <div className="relative w-full max-w-md rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md p-8 shadow-2xl hover:border-emerald-500/20 transition-all duration-300">
      <div className="absolute left-8 right-8 top-0 h-0.5 bg-primary" />

      {children}

      <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary/40" />

      <div className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-primary/40" />
    </div>
  );
}