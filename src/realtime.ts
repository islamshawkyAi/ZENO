import { supabase } from './supabase';

export type RealtimeTable = 'messages'|'notifications'|'conversation_members'|'calls'|'live_streams'|'user_follows';
type Handler = (payload: any) => void;

export function subscribeToTable(table: RealtimeTable, handler: Handler, filter?: string) {
  const channel = supabase.channel(`zeno-${table}-${Math.random().toString(36).slice(2,10)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, handler)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function subscribeToConversation(conversationId: string, handler: Handler) {
  return subscribeToTable('messages', handler, `conversation_id=eq.${conversationId}`);
}

export function subscribeToMyNotifications(userId: string, handler: Handler) {
  return subscribeToTable('notifications', handler, `user_id=eq.${userId}`);
}

export function subscribeToMyCalls(userId: string, handler: Handler) {
  const channel = supabase.channel(`zeno-calls-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `callee_id=eq.${userId}` }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `caller_id=eq.${userId}` }, handler)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function subscribeToLiveStream(streamId: string, handler: Handler) {
  return subscribeToTable('live_streams', handler, `id=eq.${streamId}`);
}

export function subscribeToConversationMembers(conversationId: string, handler: Handler) {
  return subscribeToTable('conversation_members', handler, `conversation_id=eq.${conversationId}`);
}

export function subscribeToMyFollows(userId: string, handler: Handler) {
  const channel = supabase.channel(`zeno-follows-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows', filter: `follower_id=eq.${userId}` }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows', filter: `following_id=eq.${userId}` }, handler)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}


export type CallSignal =
  | { type: 'ready' }
  | { type: 'offer'; sdp: any }
  | { type: 'answer'; sdp: any }
  | { type: 'ice-candidate'; candidate: any }
  | { type: 'hangup' };

export function subscribeToCallSignal(callId: string, handler: (signal: CallSignal) => void) {
  const channel = supabase.channel(`call:${callId}`, { config: { private: true } })
    .on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (payload?.type) handler(payload as CallSignal);
    });

  const ready = new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        reject(new Error(`Call signaling channel ${status}`));
      }
    });
  });

  return {
    channel,
    ready,
    stop: () => { void supabase.removeChannel(channel); },
  };
}

export async function sendCallSignal(channel: any, signal: CallSignal) {
  await channel.send({ type: 'broadcast', event: 'signal', payload: signal });
}
