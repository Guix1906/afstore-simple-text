import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { configService } from '../../services/configService';

export default function WhatsAppBanner() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    configService.getWhatsAppUrl().then(setUrl);
  }, []);

  return (
    <section className="px-4 py-8">
      <a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { if (!url) e.preventDefault(); }}
        className={`w-full bg-[#121212] border border-white/5 p-6 rounded-3xl flex items-center justify-between gap-4 group active:scale-[0.98] transition-all cursor-pointer block ${!url ? 'opacity-50' : ''}`}
      >
        <div className="text-left space-y-1">
          <h3 className="text-lg font-serif font-black text-white">Dúvidas?</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Especialistas AF</p>
        </div>
        <div className="bg-brand-whatsapp p-3 rounded-full text-white shadow-xl shadow-brand-whatsapp/20 group-active:scale-110 transition-transform">
          <MessageCircle size={24} fill="currentColor" fillOpacity={0.2} />
        </div>
      </a>
    </section>
  );
}

