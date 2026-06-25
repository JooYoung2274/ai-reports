import { api } from './client';

export interface Range { from?: string; to?: string }

export const getOverview = (r: Range) => api.get('/reports/overview', { params: r }).then((x) => x.data);
export const getUserDetail = (userId: string, r: Range) => api.get(`/reports/users/${userId}`, { params: r }).then((x) => x.data);
export const getPrompts = (params: Range & { userId?: string; project?: string; q?: string; cursor?: string }) =>
  api.get('/reports/prompts', { params }).then((x) => x.data);
export const getTokens = (params: Range & { groupBy: 'day' | 'user' | 'model' }) =>
  api.get('/reports/tokens', { params }).then((x) => x.data);
