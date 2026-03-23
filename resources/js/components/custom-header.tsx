interface CustomHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const CustomHeader = ({ icon, title, description }: CustomHeaderProps) => {
  return (
    <>
      {/* Page Header */}
      <div className="flex items-center gap-4 ms-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
    </>
  );
}