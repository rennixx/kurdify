import { usePlayer as usePlayerCtx } from '../context/PlayerContext';
export default function usePlayer() {
  return usePlayerCtx();
}
