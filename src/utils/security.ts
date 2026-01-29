/**
 * XSS 방지: HTML 태그 및 스크립트 제거
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // HTML 태그 제거
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // 위험한 스크립트 패턴 제거
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');
  
  // 최대 길이 제한 (DB 저장 시)
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized.trim();
};

/**
 * 입력값 검증: 도시명, 취미 등 텍스트 입력
 */
export const validateTextInput = (text: string, maxLength: number = 200): string => {
  if (!text || typeof text !== 'string') return '';
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * URL 검증: img src 등에 사용 (http/https만 허용)
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length > 2000) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

/**
 * 배열 입력값 검증 (취미 등)
 */
export const validateStringArray = (arr: string[], maxItems: number = 20): string[] => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .slice(0, maxItems)
    .map(item => validateTextInput(String(item), 100))
    .filter(item => item.length > 0);
};
