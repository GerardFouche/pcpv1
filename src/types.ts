export type Role = 'user' | 'admin';

export interface User {
  username: string;
  role: Role;
}

export interface PillRecord {
  id: number;
  user: string;
  med: string;
  count: number;
  time: string;
  verified: number;
  image: string;
}

export type View = 
  | 'login' 
  | 'settings'
  | 'dashboard' 
  | 'count_med_input' 
  | 'count_live' 
  | 'history' 
  | 'admin' 
  | 'admin_verify' 
  | 'admin_users' 
  | 'admin_reports'
  | 'admin_settings';
