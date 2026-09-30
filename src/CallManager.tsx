import React, {useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {supabase} from './supabase';
import {zeno} from './api';
import {subscribeToMyCalls} from './realtime';
import CallScreen, {ActiveCall} from './CallScreen';

export default function CallManager({externalActive,onActiveChange}:{externalActive?:ActiveCall|null;onActiveChange?:(active:ActiveCall|null)=>void}) {
  const [incoming, setIncoming] = useState<any|null>(null);
  const [active, setActive] = useState<ActiveCall|null>(null);

  useEffect(()=>{
    let stop=()=>{};
    let alive=true;
    supabase.auth.getUser().then(async ({data})=>{
      if(!alive || !data.user) return;
      stop=subscribeToMyCalls(data.user.id, async (payload)=>{
        const row=payload.new;
        if(payload.eventType==='INSERT' && row?.callee_id===data.user.id && row.status==='ringing'){
          const {data:profile}=await supabase.from('profiles').select('id,username,display_name,avatar_url').eq('id',row.caller_id).maybeSingle();
          if(alive) setIncoming({...row,profile});
        }
        if(payload.eventType==='UPDATE' && incoming?.id===row?.id && row.status!=='ringing') setIncoming(null);
      });
    });
    return()=>{alive=false;stop()};
  },[]);

  useEffect(()=>{if(active) onActiveChange?.(active)},[active]);
  const shownActive = externalActive ?? active;
  const closeActive = () => { setActive(null); onActiveChange?.(null); };

  const accept=async()=>{
    if(!incoming) return;
    const call=incoming;
    setIncoming(null);
    const r=await zeno.calls.accept(call.id);
    if(r.error){Alert.alert('المكالمة',r.error.message);return;}
    setActive({callId:call.id,otherId:call.caller_id,otherName:call.profile?.display_name||call.profile?.username||'ZENO User',type:call.call_type,isCaller:false});
  };
  const reject=async()=>{
    if(!incoming)return;
    const id=incoming.id; setIncoming(null); await zeno.calls.reject(id);
  };

  if(shownActive) return <CallScreen {...shownActive} onClose={closeActive}/>;

  return <>
    {incoming && <View style={styles.shade}>
      <View style={styles.card}>
        <View style={styles.orb}><Text style={styles.orbText}>{(incoming.profile?.display_name||incoming.profile?.username||'Z').slice(0,1).toUpperCase()}</Text></View>
        <Text style={styles.title}>{incoming.profile?.display_name||incoming.profile?.username||'ZENO User'}</Text>
        <Text style={styles.sub}>{incoming.call_type==='video'?'📹 مكالمة فيديو':'📞 مكالمة صوتية'} واردة</Text>
        <View style={styles.actions}>
          <Pressable onPress={()=>void reject()} style={[styles.btn,styles.reject]}><Text style={styles.btnText}>رفض</Text></Pressable>
          <Pressable onPress={()=>void accept()} style={[styles.btn,styles.accept]}><Text style={styles.btnText}>رد</Text></Pressable>
        </View>
      </View>
    </View>}
  </>;
}

const styles=StyleSheet.create({
  shade:{...StyleSheet.absoluteFillObject,zIndex:100,backgroundColor:'rgba(3,4,11,.86)',alignItems:'center',justifyContent:'center',padding:24},
  card:{width:'100%',maxWidth:380,padding:28,borderRadius:28,backgroundColor:'#11152A',borderWidth:1,borderColor:'rgba(120,100,255,.45)',alignItems:'center'},
  orb:{width:88,height:88,borderRadius:44,alignItems:'center',justifyContent:'center',backgroundColor:'#27204B',borderWidth:2,borderColor:'#6D5DFB'},
  orbText:{fontSize:38,fontWeight:'900',color:'#fff'},
  title:{color:'#fff',fontSize:24,fontWeight:'900',marginTop:16},
  sub:{color:'#C5C8D8',fontSize:14,marginTop:8},
  actions:{flexDirection:'row',gap:14,width:'100%',marginTop:26},
  btn:{flex:1,height:52,borderRadius:18,alignItems:'center',justifyContent:'center'},
  reject:{backgroundColor:'#2B2031'},
  accept:{backgroundColor:'#5B4BFF'},
  btnText:{color:'#fff',fontSize:17,fontWeight:'800'},
});
