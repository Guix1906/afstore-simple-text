import { AppConfig } from '../types';
import { supabase } from '../integrations/supabase/client';
import configData from '../data/config.json';

const CONFIG_FIELDS = 'id, whatsapp_number, whatsapp_message, hero_image_url, hero_image_urls';

export const configService = {
  async getConfig(): Promise<AppConfig> {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select(CONFIG_FIELDS)
        .maybeSingle();

      if (error || !data) {
        if (error) console.warn('Using fallback config due to database error:', error);
        return configData as AppConfig;
      }

      return {
        whatsappNumber: data.whatsapp_number,
        whatsappMessage: data.whatsapp_message,
        heroImageUrl: (data as any).hero_image_url || configData.heroImageUrl,
        heroImageUrls: (data as any).hero_image_urls || configData.heroImageUrls,
      };
    } catch (err) {
      console.error('Config fetch failed:', err);
      return configData as AppConfig;
    }
  },

  async getWhatsAppUrl(customMessage?: string): Promise<string> {
    const config = await this.getConfig();
    const message = encodeURIComponent(customMessage || config.whatsappMessage);
    return `https://api.whatsapp.com/send?phone=${config.whatsappNumber}&text=${message}`;
  },

  async updateConfig(config: AppConfig): Promise<void> {
    const payload = {
      whatsapp_number: config.whatsappNumber,
      whatsapp_message: config.whatsappMessage,
      hero_image_url: config.heroImageUrl,
      hero_image_urls: config.heroImageUrls,
    };

    const { data: existing } = await supabase.from('app_config').select('id').maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('app_config')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_config')
        .insert(payload);
      if (error) throw error;
    }
  }
};

