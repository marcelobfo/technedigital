import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Número 404 grande */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary/20">404</h1>
            <div className="relative -mt-16">
              <h2 className="text-4xl font-bold text-foreground">
                Página Não Encontrada
              </h2>
            </div>
          </div>

          {/* Mensagem */}
          <p className="text-xl text-muted-foreground mb-8">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>

          {/* URL tentada */}
          <div className="bg-muted/50 rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground mb-2">URL tentada:</p>
            <code className="text-sm font-mono text-destructive">
              {location.pathname}
            </code>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Voltar para Home
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link to="/blog">
                <Search className="mr-2 h-5 w-5" />
                Ver Blog
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar
            </Button>
          </div>

          {/* Links úteis */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Páginas populares:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link 
                to="/services" 
                className="text-sm text-primary hover:underline"
              >
                Serviços
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/portfolio" 
                className="text-sm text-primary hover:underline"
              >
                Portfólio
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/about" 
                className="text-sm text-primary hover:underline"
              >
                Sobre
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/contact" 
                className="text-sm text-primary hover:underline"
              >
                Contato
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
