import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { configService } from '../../services/configService';

interface WhatsAppButtonProps {
  product: Product;
  selectedSize?: string;
  selectedColor?: string;
}

export default function WhatsAppButton({ product, selectedSize, selectedColor }: WhatsAppButtonProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const updateUrl = async () => {
      const customMessage =
        `Olá! Vim pelo catálogo da AF STORE\n` +
        `Produto: ${product.name}\n` +
        `Tamanho: ${selectedSize || 'A definir'}\n` +
        `Cor: ${selectedColor || 'A definir'}\n\n` +
        `Pode me ajudar com mais informações?`;

      const generatedUrl = await configService.getWhatsAppUrl(customMessage);
      setUrl(generatedUrl);
    };

    updateUrl();
  }, [product.name, selectedSize, selectedColor]);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-safe">
      <motion.a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { if (!url) e.preventDefault(); }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`w-full bg-brand-whatsapp text-white py-4 rounded-full flex items-center justify-center gap-3 font-medium uppercase text-xs tracking-widest shadow-xl shadow-brand-whatsapp/20 hover:opacity-90 transition-opacity ${!url ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <MessageCircle size={20} fill="currentColor" fillOpacity={0.2} />
        Pedir pelo WhatsApp
      </motion.a>
    </div>
  );
}
