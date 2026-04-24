/**
 * 转换日期为纯YYYY-MM-DD格式（去除时区影响）
 * @param date 日期字符串/Date对象
 * @returns 纯日期字符串 YYYY-MM-DD
 */
export const formatPureDate = (date: string | Date): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * 获取本地今日日期（YYYY-MM-DD）
 * @returns 纯日期字符串 YYYY-MM-DD
 */
export const getTodayPureDate = (): string => {
  return formatPureDate(new Date());
};
