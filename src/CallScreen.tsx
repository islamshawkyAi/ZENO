import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView, mediaDevices} from 'react-native-webrtc';
import {zeno} from './api';
import {subscribeToCallSignal, sendCallSignal, CallSignal} from './realtime';

export type ActiveCall = {
  callId: string;
  otherId: string;
  otherName: string;
  type: 'voice'|'video';
  isCaller: boolean;
};

type Props = ActiveCall & { onClose: () => void };

export default function CallScreen({callId, otherId, otherName, type, isCaller, onClose}: Props) {
  const pcRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const localRef = useRef<any>(null);
  const remoteRef = useRef<any>(null);
  const startedAtRef = useRef<number|null>(null);
  const endingRef = useRef(false);
  const [status, setStatus] = useState(isCaller ? 'جاري الاتصال…' : 'جاري تجهيز المكالمة…');
  const [localUrl, setLocalUrl] = useState<string|null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string|null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(type === 'voice');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (startedAtRef.current) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cleanup = () => {
    try { localRef.current?.getTracks?.().forEach((t:any) => t.stop()); } catch {}
    try { remoteRef.current?.getTracks?.().forEach((t:any) => t.stop()); } catch {}
    try { pcRef.current?.close?.(); } catch {}
    channelRef.current?.stop?.();
    pcRef.current = null;
    channelRef.current = null;
    localRef.current = null;
    remoteRef.current = null;
  };

  const finish = async (notify = true) => {
    if (endingRef.current) return;
    endingRef.current = true;
    const duration = startedAtRef.current ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 0;
    if (notify && channelRef.current?.channel) {
      try { await sendCallSignal(channelRef.current.channel, {type: 'hangup'}); } catch {}
    }
    // The current billing RPC charges the authenticated caller.
    // Therefore only the caller finalizes billing; the callee only signals hangup.
    if (isCaller) {
      try { await zeno.calls.end(callId, duration); } catch {}
    }
    cleanup();
    onClose();
  };

  useEffect(() => {
    let alive = true;

    const setup = async () => {
      try {
        const ice = await zeno.calls.iceServers();
        if (!alive) return;
        if (ice.error || !ice.data?.length) throw new Error('TURN ICE servers are not available yet.');

        const signal = subscribeToCallSignal(callId, async (message: CallSignal) => {
          try {
            const pc = pcRef.current;
            if (!pc) return;
            if (message.type === 'ready' && isCaller) {
              const offer = await pc.createOffer({});
              await pc.setLocalDescription(offer);
              await sendCallSignal(signal.channel, {type: 'offer', sdp: offer});
              return;
            }
            if (message.type === 'offer' && !isCaller) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
              const answer = await pc.createAnswer({});
              await pc.setLocalDescription(answer);
              await sendCallSignal(signal.channel, {type: 'answer', sdp: answer});
              setStatus('متصل ✓');
              startedAtRef.current ??= Date.now();
              return;
            }
            if (message.type === 'answer' && isCaller) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
              setStatus('متصل ✓');
              startedAtRef.current ??= Date.now();
              return;
            }
            if (message.type === 'ice-candidate' && message.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
              return;
            }
            if (message.type === 'hangup') {
              await finish(false);
            }
          } catch (e) {
            if (alive) setStatus('تعذر إنشاء الاتصال');
          }
        });
        channelRef.current = signal;

        const pc = new RTCPeerConnection({iceServers: ice.data});
        pcRef.current = pc;

        pc.addEventListener('icecandidate', (event:any) => {
          if (event.candidate) void sendCallSignal(signal.channel, {type:'ice-candidate', candidate:event.candidate});
        });
        pc.addEventListener('track', (event:any) => {
          const stream = event.streams?.[0];
          if (stream) {
            remoteRef.current = stream;
            setRemoteUrl(stream.toURL());
          }
        });
        pc.addEventListener('connectionstatechange', () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            setStatus('متصل ✓');
            startedAtRef.current ??= Date.now();
          } else if (state === 'failed') {
            setStatus('فشل الاتصال');
          } else if (state === 'disconnected') {
            setStatus('الاتصال غير مستقر…');
          }
        });

        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? {facingMode: 'user', frameRate: 24} : false,
        });
        if (!alive) { stream.getTracks().forEach((t:any)=>t.stop()); return; }
        localRef.current = stream;
        setLocalUrl(stream.toURL());
        stream.getTracks().forEach((track:any) => pc.addTrack(track, stream));

        await signal.ready;
        if (!alive) return;
        await sendCallSignal(signal.channel, {type:'ready'});
        setStatus(isCaller ? 'في انتظار الطرف الآخر…' : 'جاري الاتصال…');
      } catch (e:any) {
        if (alive) {
          setStatus('تعذر تشغيل المكالمة');
          Alert.alert('ZENO Call', e?.message || 'تعذر الوصول إلى الكاميرا أو الميكروفون أو خادم الاتصال.');
          await finish(false);
        }
      }
    };

    void setup();
    return () => { alive = false; cleanup(); };
  }, [callId]);

  const toggleMute = () => {
    const tracks = localRef.current?.getAudioTracks?.() || [];
    const next = !muted;
    tracks.forEach((t:any)=>{t.enabled=!next;});
    setMuted(next);
  };

  const toggleCamera = () => {
    if (type !== 'video') return;
    const tracks = localRef.current?.getVideoTracks?.() || [];
    const next = !cameraOff;
    tracks.forEach((t:any)=>{t.enabled=!next;});
    setCameraOff(next);
  };

  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');

  return <View style={styles.root}>
    {remoteUrl && type === 'video' ? <RTCView streamURL={remoteUrl} style={styles.remote} objectFit="cover"/> : <View style={styles.voiceBg}><View style={styles.avatar}><Text style={styles.avatarText}>{otherName?.slice(0,1).toUpperCase() || 'Z'}</Text></View></View>}
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.top}>
        <View><Text style={styles.name}>{otherName || 'ZENO User'}</Text><Text style={styles.status}>{status} · {mm}:{ss}</Text></View>
        <View style={styles.livePill}><Text style={styles.liveText}>{type === 'video' ? 'VIDEO' : 'VOICE'}</Text></View>
      </View>
      {type === 'video' && localUrl && !cameraOff && <RTCView streamURL={localUrl} style={styles.local} objectFit="cover" zOrder={2}/>} 
      {type === 'video' && cameraOff && <View style={styles.cameraOff}><Text style={{fontSize:28}}>◉</Text></View>}
      <View style={styles.controls}>
        <Pressable onPress={toggleMute} style={styles.control}><Text style={styles.controlText}>{muted ? '🔇' : '🎙️'}</Text></Pressable>
        {type === 'video' && <Pressable onPress={toggleCamera} style={styles.control}><Text style={styles.controlText}>{cameraOff ? '📷' : '◉'}</Text></Pressable>}
        <Pressable onPress={()=>void finish(true)} style={[styles.control,styles.end]}><Text style={styles.controlText}>☎</Text></Pressable>
      </View>
    </View>
    {!localUrl && <View style={styles.loading}><ActivityIndicator color="#fff"/><Text style={styles.loadingText}>تجهيز الاتصال الآمن…</Text></View>}
  </View>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#050611'},
  remote:{...StyleSheet.absoluteFillObject},
  voiceBg:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',backgroundColor:'#090B18'},
  avatar:{width:132,height:132,borderRadius:66,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#6D5DFB',backgroundColor:'#171A3B'},
  avatarText:{fontSize:58,fontWeight:'900',color:'#fff'},
  overlay:{...StyleSheet.absoluteFillObject,justifyContent:'space-between',padding:22,paddingTop:48},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  name:{color:'#fff',fontSize:23,fontWeight:'800'},
  status:{color:'#C7C9D8',marginTop:4,fontSize:13},
  livePill:{paddingHorizontal:12,paddingVertical:7,borderRadius:20,backgroundColor:'rgba(10,12,28,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.15)'},
  liveText:{color:'#fff',fontSize:11,fontWeight:'800'},
  local:{position:'absolute',right:20,top:128,width:108,height:160,borderRadius:18,overflow:'hidden'},
  cameraOff:{position:'absolute',right:20,top:128,width:108,height:160,borderRadius:18,backgroundColor:'#15172A',alignItems:'center',justifyContent:'center'},
  controls:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:16},
  control:{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(25,28,50,.88)',borderWidth:1,borderColor:'rgba(255,255,255,.14)'},
  end:{backgroundColor:'#D6455D'},
  controlText:{fontSize:23,color:'#fff'},
  loading:{position:'absolute',left:0,right:0,top:'45%',alignItems:'center'},
  loadingText:{color:'#fff',marginTop:10,fontSize:14},
});
