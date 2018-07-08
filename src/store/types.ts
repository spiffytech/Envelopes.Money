export interface RootState {
  isOnline: boolean;
  username?: string | null;
  flash: {msg: string, type: 'error' | null} | null;
}
