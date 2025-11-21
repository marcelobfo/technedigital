import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppFloatingButtonProps {
  phoneNumber: string;
  message?: string;
}

export const WhatsAppFloatingButton = ({ 
  phoneNumber, 
  message = "Olá! Gostaria de mais informações." 
}: WhatsAppFloatingButtonProps) => {
  const handleClick = () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-fade-in group bg-[#25D366] hover:bg-[#128C7E]"
      aria-label="Conversar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
      
      <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Fale conosco no WhatsApp
      </span>
      
      <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#25D366]" />
    </Button>
  );
};
