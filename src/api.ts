import { supabase } from './supabase';

export const zeno = {
  wallet: {
    balance: () => supabase.from('wallets').select('balance,updated_at').maybeSingle(),
    packages: () => supabase.from('coin_packages').select('id,name,coins,price_minor,currency').eq('active', true).order('sort_order'),
    transactions: (limit = 20) => supabase.from('transactions').select('id,type,amount,balance_after,reference_id,metadata,created_at').order('created_at', { ascending: false }).limit(limit),
  },
  profile: {
    discover: (query?: string, limit = 20) => supabase.rpc('discover_profiles', { p_query: query ?? null, p_limit: limit }),
    follow: (userId: string) => supabase.rpc('follow_user', { p_user_id: userId }),
    unfollow: (userId: string) => supabase.rpc('unfollow_user', { p_user_id: userId }),
    update: (p: { username?: string|null; display_name?: string|null; avatar_url?: string|null; bio?: string|null; is_private?: boolean }) => supabase.rpc('update_my_profile', {
      p_username: p.username ?? null, p_display_name: p.display_name ?? null, p_avatar_url: p.avatar_url ?? null,
      p_bio: p.bio ?? null, p_is_private: p.is_private ?? false,
    }),
  },
  chat: {
    createDirect: (otherUser: string) => supabase.rpc('create_direct_conversation', { p_other_user: otherUser }),
    send: (conversationId: string, body: string, replyToId?: string) => supabase.rpc('send_message', {
      p_conversation_id: conversationId, p_body: body, p_message_type: 'text', p_media_url: null,
      p_reply_to_id: replyToId ?? null, p_metadata: {},
    }),
    markRead: (conversationId: string) => supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId }),
    unread: (conversationId: string) => supabase.rpc('get_unread_count', { p_conversation_id: conversationId }),
    edit: (messageId: string, body: string) => supabase.rpc('edit_message', { p_message_id: messageId, p_body: body }),
    remove: (messageId: string) => supabase.rpc('delete_message', { p_message_id: messageId }),
  },
  calls: {
    iceServers: async () => {
      const { data, error } = await supabase.functions.invoke('get-turn-ice-servers', { method: 'GET' });
      return { data: data?.iceServers ?? [], provider: data?.provider ?? 'metered', error };
    },
    create: (calleeId: string, type: 'voice'|'video', conversationId: string) => supabase.rpc('create_call', { p_callee_id: calleeId, p_call_type: type, p_conversation_id: conversationId }),
    accept: (callId: string) => supabase.rpc('accept_call', { p_call_id: callId }),
    reject: (callId: string) => supabase.rpc('reject_call', { p_call_id: callId }),
    cancel: (callId: string) => supabase.rpc('cancel_call', { p_call_id: callId }),
    end: (callId: string, seconds: number) => supabase.rpc('end_call', { p_call_id: callId, p_duration_seconds: seconds }),
  },
  live: {
    start: (title?: string) => supabase.rpc('start_live_stream', { p_title: title ?? null }),
    end: (streamId: string) => supabase.rpc('end_live_stream', { p_stream_id: streamId }),
    join: (streamId: string) => supabase.rpc('join_live_stream', { p_stream_id: streamId }),
    leave: (streamId: string) => supabase.rpc('leave_live_stream', { p_stream_id: streamId }),
    report: (streamId: string, reason: string, details?: string) => supabase.rpc('report_live_stream', { p_stream_id: streamId, p_reason: reason, p_details: details ?? null }),
  },
  gifts: {
    catalog: () => supabase.from('gift_catalog').select('id,slug,name,emoji,price_coins,metadata').eq('active', true).order('sort_order'),
    send: (recipientId: string, giftId: string, quantity = 1, conversationId?: string, liveStreamId?: string) => supabase.rpc('send_gift', {
      p_recipient_id: recipientId, p_gift_id: giftId, p_quantity: quantity,
      p_conversation_id: conversationId ?? null, p_live_stream_id: liveStreamId ?? null,
    }),
  },
  notifications: {
    list: (limit = 50) => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit),
    read: (id: string) => supabase.rpc('mark_notification_read', { p_notification_id: id }),
    readAll: () => supabase.rpc('mark_all_notifications_read'),
  },
  ai: {
    createConversation: (title?: string) => supabase.rpc('create_ai_conversation', { p_title: title ?? null }),
    saveMessage: (conversationId: string, role: 'user'|'assistant'|'system', content: string, model?: string) => supabase.rpc('save_ai_message', {
      p_conversation_id: conversationId, p_role: role, p_content: content, p_model: model ?? null, p_metadata: {},
    }),
  },
  games: {
    catalog: () => supabase.from('game_catalog').select('*').eq('enabled', true).order('sort_order'),
    createRoom: (slug: string, maxPlayers?: number) => supabase.rpc('create_game_room', { p_game_slug: slug, p_max_players: maxPlayers ?? null }),
    joinRoom: (roomId: string) => supabase.rpc('join_game_room', { p_room_id: roomId }),
    ready: (roomId: string, ready: boolean) => supabase.rpc('set_game_ready', { p_room_id: roomId, p_ready: ready }),
    start: (roomId: string) => supabase.rpc('start_game_room', { p_room_id: roomId }),
    queue: (slug: string) => supabase.rpc('join_game_queue', { p_game_slug: slug }),
    leaveQueue: (slug: string) => supabase.rpc('leave_game_queue', { p_game_slug: slug }),
  },
  luck: {
    active: () => supabase.rpc('get_active_luck_event'),
    answer: (eventId: string, questionId: string, answer: string, responseMs: number) => supabase.rpc('submit_luck_answer', {
      p_event_id: eventId, p_question_id: questionId, p_answer: answer, p_response_ms: responseMs,
    }),
  },
};
