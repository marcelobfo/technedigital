import { useEffect } from "react";

const Sitemap = () => {
  useEffect(() => {
    // Redirecionar para a edge function
    window.location.replace('https://nuqedbodehxicrtmgcnx.supabase.co/functions/v1/generate-sitemap');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecionando para sitemap...</p>
      </div>
    </div>
  );
};

export default Sitemap;
