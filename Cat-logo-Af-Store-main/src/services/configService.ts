import { AppConfig } from '../types';
import { supabase } from '../integrations/supabase/client';
import configData from '../data/config.json';

const CONFIG_FIELDS = 'id, whatsapp_number, whatsapp_message, hero_image_url, hero_image_urls';
const CONFIG_CACHE_KEY = 'af-cache:app-config';

const safeStorage = {
  get(key: string) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop
    }
  },
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> => {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

const isTransientNetworkError = (error: unknown) => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('request timeout')
  );
};

const normalizeConfig = (value?: Partial<AppConfig> | null): AppConfig => ({
  const normalizedHeroImageUrls = Array.isArray(value?.heroImageUrls)
    ? value.heroImageUrls
        .map((url) => String(url || '').trim())
        .filter((url) => url.length > 0)
    : [];

  const normalizedHeroImageUrl = String(value?.heroImageUrl || '').trim();

  whatsappNumber: String(value?.whatsappNumber || configData.whatsappNumber || ''),
  whatsappMessage: String(value?.whatsappMessage || configData.whatsappMessage || ''),
  heroImageUrl:
    normalizedHeroImageUrl ||
    normalizedHeroImageUrls[0] ||
    String(configData.heroImageUrl || '').trim(),
  heroImageUrls:
    normalizedHeroImageUrls.length > 0
      ? normalizedHeroImageUrls
      : (configData.heroImageUrls || [])
          .map((url) => String(url || '').trim())
          .filter((url) => url.length > 0),
});

export const configService = {
  async getConfig(): Promise<AppConfig> {
    try {
      const { data, error } = await withTimeout(
        supabase
        .from('app_config')
        .select(CONFIG_FIELDS)
        .maybeSingle()
      );

      if (!error && data) {
        const normalized = normalizeConfig({
          whatsappNumber: data.whatsapp_number,
          whatsappMessage: data.whatsapp_message,
          heroImageUrl: (data as any).hero_image_url,
          heroImageUrls: (data as any).hero_image_urls,
        });
        safeStorage.set(CONFIG_CACHE_KEY, normalized);
        return normalized;
      }

      if (error) {
        if (error) console.warn('Using fallback config due to database error:', error);
      }

      const cached = safeStorage.get(CONFIG_CACHE_KEY);
      if (cached) return normalizeConfig(cached);

      return normalizeConfig(configData as AppConfig);
    } catch (err) {
      console.error('Config fetch failed:', err);
      const cached = safeStorage.get(CONFIG_CACHE_KEY);
      if (cached) return normalizeConfig(cached);
      return normalizeConfig(configData as AppConfig);
    }
  },

  async getWhatsAppUrl(customMessage?: string): Promise<string> {
    const config = await this.getConfig();
    const message = encodeURIComponent(customMessage || config.whatsappMessage);
    return `https://api.whatsapp.com/send?phone=${config.whatsappNumber}&text=${message}`;
  },

  async updateConfig(config: AppConfig): Promise<void> {
    const normalized = normalizeConfig(config);
    safeStorage.set(CONFIG_CACHE_KEY, normalized);

    try {
      const payload = {
        whatsapp_number: normalized.whatsappNumber,
        whatsapp_message: normalized.whatsappMessage,
        hero_image_url: normalized.heroImageUrl,
        hero_image_urls: normalized.heroImageUrls,
      };

      const { data: existing } = await withTimeout(
        supabase.from('app_config').select('id').maybeSingle()
      );

      if (existing) {
        const { error } = await withTimeout(
          supabase
            .from('app_config')
            .update(payload)
            .eq('id', existing.id)
        );
        if (error) throw error;
      } else {
        const { error } = await withTimeout(
          supabase
            .from('app_config')
            .insert(payload)
        );
        if (error) throw error;
      }
    } catch (error) {
      if (!isTransientNetworkError(error)) {
        throw error;
      }

      console.warn('Config persisted only in local cache due to network issue.');
    }
  }
};

