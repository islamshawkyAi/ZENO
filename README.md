# ZENO — Final Closed Foundation + WebRTC Calls

ZENO — More Than Just Chat.

## Current production foundation
- Supabase Auth / OTP
- Profiles, chats, notifications, wallet, gifts, games, live foundation
- Realtime chat/notifications/calls
- Secure Metered TURN integration through Supabase Edge Function `get-turn-ice-servers`
- WebRTC voice/video call client using `react-native-webrtc`
- Private Supabase Realtime Broadcast signaling for call SDP/ICE
- Caller-only billing finalization to match the existing server-side `end_call` billing RPC
- Android camera/microphone config through `@config-plugins/react-native-webrtc`

## TURN security
The Metered credential is never stored in the app. The client calls the authenticated Supabase Edge Function, which reads `METERED_TURN_API_KEY` from Edge Function secrets and returns only ICE server configuration.

## Native build note
WebRTC contains native code and is not available in Expo Go. The production AAB must be built with EAS/native prebuild so the WebRTC module and config plugin are included.
