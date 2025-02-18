const express = require('express');
const apiRouter = require('./backend/api');

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

// Add existing static file serving
app.use(express.static(__dirname));

module.exports = app;

// Add these imports to existing imports

function App() {
  const messages = React.useSyncExternalStore(
    room.collection('message').subscribe,
    () => room.collection('message').getList() || []
  );

  const reactions = React.useSyncExternalStore(
    room.collection('reaction').subscribe,
    () => room.collection('reaction').getList() || []
  );

  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isAITyping, setIsAITyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPickers = document.querySelectorAll('.emoji-picker');
      let clickedInside = false;
      emojiPickers.forEach(picker => {
        if (picker.contains(event.target)) clickedInside = true;
      });
      if (!clickedInside) setActiveEmojiPicker(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      let imageUrl = null;
      const userLanguage = aiService.detectLanguage(newMessage);
      
      if (selectedImage) {
        setIsAITyping(true);
        
        setUploadingImage(true);
        imageUrl = await websim.upload(selectedImage);
        
        const analysisPrompt = userLanguage === 'es'
          ? `Por favor analiza este ${selectedImage.type.startsWith('image/') ? 'imagen' : 'PDF'} y describe su contenido en detalle.`
          : `Please analyze this ${selectedImage.type.startsWith('image/') ? 'image' : 'PDF'} and describe its content in detail.`;
        
        const aiResponse = await aiService.generateResponse(analysisPrompt, selectedImage);
        
        await room.collection('message').create({
          content: newMessage.trim(),
          imageUrl: imageUrl,
          isUser: true
        });

        await room.collection('message').create({
          content: aiResponse,
          isAI: true,
          username: 'Copy Xpert'
        });
        
        setUploadingImage(false);
        setIsAITyping(false);
      } else {
        await room.collection('message').create({
          content: newMessage.trim(),
          isUser: true
        });

        setIsAITyping(true);
        const aiResponse = await aiService.generateResponse(newMessage.trim());
        
        await room.collection('message').create({
          content: aiResponse,
          isAI: true,
          username: 'Copy Xpert'
        });
      }

      setNewMessage('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setIsAITyping(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setUploadingImage(false);
      setIsAITyping(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSelectedImage(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setSelectedImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setSelectedImagePreview('pdf');
      }
    }
  };

  const handleAddReaction = async (messageId, emoji, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const existingReaction = reactions.find(
        r => r.message_id === messageId && 
             r.emoji === emoji && 
             r.username === room.party.client.username
      );

      if (existingReaction) {
        await room.collection('reaction').delete(existingReaction.id);
      } else {
        await room.collection('reaction').create({
          message_id: messageId,
          emoji: emoji
        });
      }
    } catch (error) {
      console.error('Error managing reaction:', error);
    }
    setActiveEmojiPicker(null);
  };

  const getMessageReactions = (messageId) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    return messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.username);
      if (reaction.username === room.party.client.username) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {});
  };

  const getAITypingMessage = (language) => {
    return language === 'es' ? 'AI está escribiendo...' : 'AI is typing...';
  };

  return (
    <div className="app">
      <ChatHeader />
      <div className="chat-messages">
        {sortedMessages.map(message => (
          <Message
            key={message.id}
            message={message}
            reactions={getMessageReactions(message.id)}
            onReaction={handleAddReaction}
            activeEmojiPicker={activeEmojiPicker}
            onToggleEmojiPicker={(messageId, e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveEmojiPicker(activeEmojiPicker === messageId ? null : messageId);
            }}
          />
        ))}
        {isAITyping && (
          <div className="ai-typing-indicator">
            {getAITypingMessage(aiService.detectLanguage(newMessage))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSubmit={handleSendMessage}
        onFileSelect={handleFileSelect}
        uploadingImage={uploadingImage}
        selectedImagePreview={selectedImagePreview}
        selectedImage={selectedImage}
        onRemoveImage={() => {
          setSelectedImage(null);
          setSelectedImagePreview(null);
          fileInputRef.current.value = '';
        }}
        fileInputRef={fileInputRef}
        isAITyping={isAITyping}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);