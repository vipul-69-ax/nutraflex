import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Reaction = '❤️' | '👍' | '👎' | '😂' | '😮' | '😢';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  replyTo?: string;
  reactions: Reaction[];
};

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

const SWIPE_THRESHOLD = -50;

const MessageItem = React.memo(({ item, onReply, onReaction }: { item: Message; onReply: (id: string) => void; onReaction: (id: string, reaction: Reaction) => void }) => {
  const translateX = useSharedValue(0);
  const contextMenuOpacity = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        onReply(item.id);
      }
      translateX.value = withSpring(0);
    });

  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      contextMenuOpacity.value = withSpring(1);
    })
    .onFinalize(() => {
      contextMenuOpacity.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const contextMenuStyle = useAnimatedStyle(() => ({
    opacity: contextMenuOpacity.value,
  }));

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, longPressGesture)}>
      <AnimatedPressable
        entering={SlideInRight}
        exiting={SlideOutLeft}
        style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.botMessage, animatedStyle]}
      >
        {item.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText}>
              Replying to: {item.replyTo.slice(0, 30)}...
            </Text>
          </View>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <View style={styles.reactionsContainer}>
          {item.reactions.map((reaction, index) => (
            <Animated.Text key={index} entering={FadeIn} exiting={FadeOut} style={styles.reaction}>
              {reaction}
            </Animated.Text>
          ))}
        </View>
        <Animated.View style={[styles.contextMenu, contextMenuStyle]}>
          {['❤️', '👍', '👎', '😂', '😮', '😢'].map((reaction) => (
            <TouchableOpacity
              key={reaction}
              onPress={() => onReaction(item.id, reaction as Reaction)}
              style={styles.reactionButton}
            >
              <Text>{reaction}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </AnimatedPressable>
    </GestureDetector>
  );
});

export default function Chatbot() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm your health assistant. How can I help you today?", sender: 'bot', reactions: [] },
  ]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    if (input.trim()) {
      const userMessage: Message = { 
        id: Date.now().toString(), 
        text: input.trim(), 
        sender: 'user',
        replyTo: replyingTo || undefined,
        reactions: []
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
      setReplyingTo(null);
      
      setTimeout(() => {
        const botMessage: Message = { 
          id: (Date.now() + 1).toString(), 
          text: "I'm processing your request. As a health assistant, I can provide general health information, but remember that for specific medical advice, it's best to consult with a healthcare professional.", 
          sender: 'bot',
          reactions: []
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    }
  }, [input, replyingTo]);

  const handleReply = useCallback((messageId: string) => {
    setReplyingTo(messageId);
  }, []);

  const handleReaction = useCallback((messageId: string, reaction: Reaction) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId
          ? { ...message, reactions: [...message.reactions, reaction] }
          : message
      )
    );
  }, []);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageItem item={item} onReply={handleReply} onReaction={handleReaction} />
  ), [handleReply, handleReaction]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Health Assistant</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />
      {replyingTo && (
        <View style={styles.replyingContainer}>
          <Text style={styles.replyingText}>
            Replying to: {messages.find((m) => m.id === replyingTo)?.text.slice(0, 30)}...
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close-circle" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor="#8e8e8e"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#3897f0" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 22,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3897f0',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#efefef',
  },
  messageText: {
    fontSize: 14,
    color: '#262626',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#efefef',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reaction: {
    fontSize: 16,
    marginRight: 4,
  },
  contextMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionButton: {
    padding: 8,
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#efefef',
    borderTopWidth: 1,
    borderTopColor: '#dbdbdb',
  },
  replyingText: {
    flex: 1,
    fontSize: 12,
    color: '#8e8e8e',
  },
});
