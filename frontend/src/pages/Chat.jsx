import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import 'stream-chat-react/dist/css/v2/index.css';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

let clientInstance = null;

export default function ChatPage() {
  const { artistId } = useParams(); // Artist._id
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chatClient,  setChatClient]  = useState(null);
  const [channel,     setChannel]     = useState(null);
  const [artistName,  setArtistName]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const init = async () => {
      try {
        // 1. Token fetch
        const { data: tokenData } = await api.get('/chat/token');

        // 2. Stream client init (singleton)
        if (!clientInstance) {
          clientInstance = StreamChat.getInstance(tokenData.apiKey);
        }

        if (!clientInstance.userID) {
          await clientInstance.connectUser(
            { id: tokenData.userId, name: tokenData.userName },
            tokenData.token
          );
        }

        // 3. Channel create/fetch
        const { data: channelData } = await api.post('/chat/channel', { artistId });
        setArtistName(channelData.artistName);

        const ch = clientInstance.channel('messaging', channelData.channelId);
        await ch.watch();

        setChatClient(clientInstance);
        setChannel(ch);
      } catch (err) {
        console.error(err);
        setError('Could not connect to chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      // Cleanup on unmount
      if (clientInstance?.userID) {
        clientInstance.disconnectUser();
        clientInstance = null;
      }
    };
  }, [artistId, user]);

  if (loading) return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:32, height:32, border:'2px solid #EDE3D5', borderTopColor:'#C4622D', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#8C7B6B', fontSize:'0.9rem' }}>Connecting to chat...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#B91C1C', marginBottom:16 }}>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-outline">Go Back</button>
      </div>
    </div>
  );

  if (!chatClient || !channel) return null;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#8C7B6B' }}>
          <ArrowLeft size={16}/> Back
        </button>
        <div style={{ height:20, width:1, background:'#EDE3D5' }}/>
        <div>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'#8C7B6B' }}>Chat with</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'#1A1208' }}>{artistName}</p>
        </div>
      </div>

      {/* Stream Chat UI */}
      <div style={{ border:'1px solid #EDE3D5', borderRadius:0, overflow:'hidden', height:'70vh' }}>
        <Chat client={chatClient} theme="str-chat__theme-light">
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>

      {/* Stream CSS overrides — U-Craft branding */}
      <style>{`
        .str-chat { font-family: 'DM Sans', sans-serif !important; }
        .str-chat__channel-header { background: #1A1208 !important; color: white !important; }
        .str-chat__channel-header .str-chat__header-title { color: white !important; }
        .str-chat__message--me .str-chat__message-bubble { background: #C4622D !important; color: white !important; }
        .str-chat__send-button { background: #1A1208 !important; }
        .str-chat__message-input { border-top: 1px solid #EDE3D5 !important; }
        .str-chat__input-flat { border: 1.5px solid #EDE3D5 !important; border-radius: 0 !important; }
        .str-chat__input-flat:focus-within { border-color: #C4622D !important; }
      `}</style>
    </div>
  );
}