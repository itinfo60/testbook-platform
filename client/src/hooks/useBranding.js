import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '@/services/api';
import { setBranding } from '@/features/institute/brandingSlice';

function hexToRgb(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].join(' ');
}

// Generate a simple 11-shade scale from a single hex "600" value via HSL adjustment
function generatePrimaryScale(hex600) {
  if (!hex600 || !/^#[0-9A-Fa-f]{6}$/.test(hex600)) return null;

  const r = parseInt(hex600.slice(1, 3), 16) / 255;
  const g = parseInt(hex600.slice(3, 5), 16) / 255;
  const b = parseInt(hex600.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);

  function hslToRgbStr(hd, sp, lp) {
    const h_ = hd / 360,
      s_ = sp / 100,
      l_ = lp / 100;
    let r_, g_, b_;
    if (s_ === 0) {
      r_ = g_ = b_ = l_;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l_ < 0.5 ? l_ * (1 + s_) : l_ + s_ - l_ * s_;
      const p = 2 * l_ - q;
      r_ = hue2rgb(p, q, h_ + 1 / 3);
      g_ = hue2rgb(p, q, h_);
      b_ = hue2rgb(p, q, h_ - 1 / 3);
    }
    return [Math.round(r_ * 255), Math.round(g_ * 255), Math.round(b_ * 255)].join(' ');
  }

  return {
    '--p-50': hslToRgbStr(hDeg, Math.max(sPct - 20, 10), 97),
    '--p-100': hslToRgbStr(hDeg, Math.max(sPct - 15, 15), 94),
    '--p-200': hslToRgbStr(hDeg, Math.max(sPct - 10, 20), 89),
    '--p-300': hslToRgbStr(hDeg, sPct, 78),
    '--p-400': hslToRgbStr(hDeg, sPct, 67),
    '--p-500': hslToRgbStr(hDeg, sPct, 57),
    '--p-600': hexToRgb(hex600),
    '--p-700': hslToRgbStr(hDeg, Math.min(sPct + 5, 100), 42),
    '--p-800': hslToRgbStr(hDeg, Math.min(sPct + 8, 100), 33),
    '--p-900': hslToRgbStr(hDeg, Math.min(sPct + 10, 100), 26),
    '--p-950': hslToRgbStr(hDeg, Math.min(sPct + 12, 100), 17),
  };
}

function applyBranding(branding) {
  const root = document.documentElement;

  // Title
  if (branding.websiteTitle || branding.name) {
    document.title = branding.websiteTitle || branding.name;
  }

  // Favicon
  const faviconUrl = branding.theme?.faviconUrl;
  if (faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }

  // Primary color scale
  const primaryColor = branding.theme?.primaryColor;
  if (primaryColor) {
    const scale = generatePrimaryScale(primaryColor);
    if (scale) {
      Object.entries(scale).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
    }
  }
}

export default function useBranding() {
  const dispatch = useDispatch();

  useEffect(() => {
    api
      .get('/institutes/branding')
      .then(({ data }) => {
        const branding = data.data || data;
        if (!branding) return;
        applyBranding(branding);
        dispatch(
          setBranding({
            name: branding.name,
            websiteTitle: branding.websiteTitle,
            logoUrl: branding.logo?.url || '',
            primaryColor: branding.theme?.primaryColor || '',
            faviconUrl: branding.theme?.faviconUrl || '',
          })
        );
      })
      .catch(() => {
        // No tenant / no branding — use defaults, no-op
      });
  }, [dispatch]);
}
