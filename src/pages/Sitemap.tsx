import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Sitemap = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // Redirecionar direto para a edge function
        window.location.href = 'https://nuqedbodehxicrtmgcnx.supabase.co/functions/v1/generate-sitemap';
      } catch (error) {
        console.error('Erro ao buscar sitemap:', error);
        navigate('/');
      }
    };

    fetchSitemap();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Carregando sitemap...</p>
    </div>
  );
};

export default Sitemap;
