import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { ArrowLeft, MessageCircle } from 'lucide-react';

let clientInstance = null;

export default function ChatPage() {
  const { artistId } = useParams();
  const [searchParams] = useSearchParams();
  const prefilledMsg = searchParams.get('msg') || '';
  const sentPrefillRef = useRef(false);
  const { user, artistProfile } = useAuth();
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [artistName, setArtistName] = useState('Messages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isArtistInbox = user?.role === 'artist';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const { data: tokenData } = await api.get('/chat/token');

        if (!clientInstance) {
          clientInstance = StreamChat.getInstance(tokenData.apiKey);
        }

        if (clientInstance.userID && clientInstance.userID !== tokenData.userId) {
          await clientInstance.disconnectUser();
        }

        if (!clientInstance.userID) {
          await clientInstance.connectUser(
            { id: tokenData.userId, name: tokenData.userName },
            tokenData.token
          );
        }

        if (cancelled) return;
        setChatClient(clientInstance);

        if (isArtistInbox) {
          setArtistName(artistProfile?.brandName || user.name || 'Messages');
          const artistChannels = await clientInstance.queryChannels(
            { type: 'messaging', members: { $in: [tokenData.userId] } },
            { last_message_at: -1, updated_at: -1 },
            { watch: true, state: true }
          );

          if (cancelled) return;
          setChannels(artistChannels);
          setChannel(artistChannels[0] || null);
          return;
        }

        const { data: channelData } = await api.post('/chat/channel', { artistId });
        setArtistName(channelData.artistName);

        const buyerChannel = clientInstance.channel('messaging', channelData.channelId);
        await buyerChannel.watch();

        if (prefilledMsg && !sentPrefillRef.current) {
          sentPrefillRef.current = true;
          await buyerChannel.sendMessage({ text: prefilledMsg });
        }

        if (cancelled) return;
        setChannel(buyerChannel);
      } catch (err) {
        console.error(err);
        setError('Could not connect to chat. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [artistId, user?._id, user?.role, artistProfile?._id]);

  useEffect(() => {
    return () => {
      if (clientInstance?.userID) {
        clientInstance.disconnectUser();
        clientInstance = null;
      }
    };
  }, []);

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

  if (!chatClient) return null;

  return (
    <div className="chat-page-shell">
      <div className="chat-topbar">
        <button onClick={() => navigate(-1)} className="chat-back-btn">
          <ArrowLeft size={16}/> Back
        </button>
        <div className="chat-divider" />
        <div>
          <p className="chat-eyebrow">{isArtistInbox ? 'Customer chats' : 'Chat with'}</p>
          <p className="chat-title">{artistName}</p>
        </div>
      </div>

      {isArtistInbox && channels.length === 0 ? (
        <div className="chat-empty">
          <MessageCircle size={34}/>
          <p>No customer messages yet</p>
        </div>
      ) : (
        <div className={`chat-layout ${isArtistInbox ? 'with-sidebar' : ''}`}>
          {isArtistInbox && (
            <aside className="chat-sidebar">
              {channels.map(ch => {
                const otherMembers = Object.values(ch.state.members || {})
                  .map(member => member.user)
                  .filter(memberUser => memberUser?.id !== user._id);
                const label = otherMembers[0]?.name || ch.data?.name || 'Customer';
                const lastMessage = ch.state.messages?.[ch.state.messages.length - 1]?.text || 'Open conversation';

                return (
                  <button
                    key={ch.cid}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`chat-thread-btn ${channel?.cid === ch.cid ? 'active' : ''}`}
                  >
                    <span>{label}</span>
                    <small>{lastMessage}</small>
                  </button>
                );
              })}
            </aside>
          )}

          <main className="chat-panel">
            {channel && (
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
            )}
          </main>
        </div>
      )}

      <style>{`
        .chat-page-shell{max-width:1100px;margin:0 auto;padding:24px 16px;height:calc(100dvh - 88px);display:flex;flex-direction:column;min-height:560px;}
        .chat-topbar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-shrink:0;}
        .chat-back-btn{display:flex;align-items:center;gap:6px;background:transparent;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;color:#8C7B6B;padding:4px 0;}
        .chat-divider{height:20px;width:1px;background:#EDE3D5;}
        .chat-eyebrow{font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#8C7B6B;margin:0;}
        .chat-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:#1A1208;margin:0;}
        .chat-layout{border:1px solid #EDE3D5;display:grid;grid-template-columns:1fr;min-height:0;flex:1;overflow:hidden;background:white;}
        .chat-layout.with-sidebar{grid-template-columns:260px minmax(0,1fr);}
        .chat-sidebar{border-right:1px solid #EDE3D5;overflow-y:auto;background:#FDFAF5;min-height:0;}
        .chat-thread-btn{width:100%;display:flex;flex-direction:column;gap:4px;text-align:left;padding:13px 14px;border:0;border-bottom:1px solid #EDE3D5;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#1A1208;}
        .chat-thread-btn.active{background:#F7F0E6;border-left:3px solid #C4622D;}
        .chat-thread-btn span{font-size:.86rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .chat-thread-btn small{font-size:.74rem;color:#8C7B6B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .chat-panel{min-width:0;min-height:0;overflow:hidden;}
        .chat-empty{border:1px solid #EDE3D5;background:#FDFAF5;flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#8C7B6B;font-family:'DM Sans',sans-serif;}
        .str-chat{height:100%!important;font-family:'DM Sans',sans-serif!important;}
        .str-chat__channel{height:100%!important;min-height:0!important;}
        .str-chat__main-panel{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
        .str-chat__list{min-height:0!important;overflow-y:auto!important;}
        .str-chat__channel-header{background:#1A1208!important;color:white!important;flex-shrink:0!important;}
        .str-chat__channel-header .str-chat__header-title{color:white!important;}
        .str-chat__message--me .str-chat__message-bubble{background:#C4622D!important;color:white!important;}
        .str-chat__send-button{background:#1A1208!important;}
        .str-chat__message-input{border-top:1px solid #EDE3D5!important;flex-shrink:0!important;}
        .str-chat__input-flat{border:1.5px solid #EDE3D5!important;border-radius:0!important;}
        .str-chat__input-flat:focus-within{border-color:#C4622D!important;}
        @media(max-width:700px){
          .chat-page-shell{height:calc(100dvh - 72px);min-height:0;padding:12px 10px;}
          .chat-layout.with-sidebar{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);}
          .chat-sidebar{display:flex;overflow-x:auto;overflow-y:hidden;border-right:0;border-bottom:1px solid #EDE3D5;max-height:86px;}
          .chat-thread-btn{min-width:180px;border-right:1px solid #EDE3D5;border-bottom:0;}
          .chat-panel{min-height:0;}
        }
      `}</style>
    </div>
  );
}
