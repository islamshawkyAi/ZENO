import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {ZENO, gradients} from './designSystem';

export function Avatar({label='Z', size=50, online=false}:{label?:string;size?:number;online?:boolean}) {
  return <View><LinearGradient colors={gradients.primary} style={[u.avatar,{width:size,height:size,borderRadius:size/2}]}><Text style={[u.avatarText,{fontSize:size*.34}]}>{label.slice(0,1).toUpperCase()}</Text></LinearGradient>{online&&<View style={[u.online,{width:size*.24,height:size*.24,borderRadius:size*.12}]}/>}</View>;
}
export function GlassCard({children,onPress,style}:{children:React.ReactNode;onPress?:()=>void;style?:any}) {
  const body=<View style={[u.card,style]}>{children}</View>; return onPress?<Pressable onPress={onPress}>{body}</Pressable>:body;
}
export function Pill({children,active=false,onPress}:{children:React.ReactNode;active?:boolean;onPress?:()=>void}) { const body=<View style={[u.pill,active&&u.pillActive]}>{children}</View>; return onPress?<Pressable onPress={onPress}>{body}</Pressable>:body; }
export function SectionTitle({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}) { return <View style={u.row}><Text style={u.section}>{title}</Text>{action&&<Pressable onPress={onAction}><Text style={u.action}>{action}</Text></Pressable>}</View>; }
export function GradientButton({title,onPress,small=false}:{title:string;onPress:()=>void;small?:boolean}) { return <Pressable onPress={onPress} style={small?u.smallButtonWrap:undefined}><LinearGradient colors={gradients.primary} style={[u.button,small&&u.smallButton]}><Text style={u.buttonText}>{title}</Text></LinearGradient></Pressable>; }
export function IconButton({icon,onPress,badge=false}:{icon:string;onPress:()=>void;badge?:boolean}) { return <Pressable onPress={onPress} style={u.iconButton}><Text style={u.icon}>{icon}</Text>{badge&&<View style={u.badgeDot}/>}</Pressable>; }
export const u=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  avatar:{alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'900'},online:{position:'absolute',right:0,bottom:1,backgroundColor:ZENO.colors.green,borderWidth:2,borderColor:ZENO.colors.bg},
  card:{backgroundColor:ZENO.colors.glass,borderWidth:1,borderColor:ZENO.colors.border,borderRadius:ZENO.radius.lg,padding:16},
  pill:{paddingHorizontal:13,paddingVertical:8,borderRadius:999,backgroundColor:ZENO.colors.glass,borderWidth:1,borderColor:ZENO.colors.border},pillActive:{borderColor:ZENO.colors.borderBlue,backgroundColor:'rgba(77,124,255,0.14)'},
  section:{color:ZENO.colors.text,fontSize:18,fontWeight:'900'},action:{color:ZENO.colors.cyan,fontSize:13,fontWeight:'800'},
  button:{minHeight:48,paddingHorizontal:20,borderRadius:16,alignItems:'center',justifyContent:'center'},buttonText:{color:'#fff',fontSize:14,fontWeight:'900'},smallButtonWrap:{alignSelf:'flex-start'},smallButton:{minHeight:40,paddingHorizontal:15},
  iconButton:{width:44,height:44,borderRadius:15,backgroundColor:ZENO.colors.glass,borderWidth:1,borderColor:ZENO.colors.border,alignItems:'center',justifyContent:'center'},icon:{fontSize:20,color:ZENO.colors.text},badgeDot:{position:'absolute',right:8,top:7,width:8,height:8,borderRadius:4,backgroundColor:ZENO.colors.red,borderWidth:1,borderColor:ZENO.colors.bg},
});
