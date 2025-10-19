import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  Smile, 
  MoreVertical,
  Reply,
  Forward,
  Star,
  Archive,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Badge from '../common/Badge';

const MessageThread = ({ messages = [], onSendMessage, isLoading = false, disabled = false, currentUserId = null }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (isLoading || disabled) return;

    // For now, just send the message text (files and replies can be added later)
    onSendMessage(newMessage.trim());
    setNewMessage('');
    setSelectedFiles([]);
    setReplyingTo(null);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4" />;
      default:
        return <Paperclip className="w-4 h-4" />;
    }
  };

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message Header */}
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {!isOwn && (
            <img
              src={message.senderAvatar || 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={message.senderName || 'Other User'}
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <span className="text-xs text-gray-500">{message.senderName || (isOwn ? 'You' : 'Other User')}</span>
          <span className="text-xs text-gray-400">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>

        {/* Reply Context */}
        {message.replyTo && (
          <div className="bg-gray-100 border-l-4 border-gray-300 p-2 mb-2 rounded text-xs">
            <div className="text-gray-600">Replying to:</div>
            <div className="text-gray-800 truncate">Previous message content...</div>
          </div>
        )}

        {/* Message Content */}
        <div className={`rounded-lg px-4 py-2 ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm">{message.message}</p>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((file, index) => (
                <div key={index} className={`flex items-center gap-2 p-2 rounded ${
                  isOwn ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {getFileIcon(file)}
                  <span className="text-xs truncate flex-1">{file}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    className={isOwn ? 'text-white hover:text-blue-100' : 'text-gray-600'}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setReplyingTo(message)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Reply className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </div>

        {/* Read Status */}
        {isOwn && (
          <div className="text-xs text-gray-400 text-right mt-1">
            {message.read ? (
              <span className="flex items-center justify-end gap-1">
                <Eye className="w-3 h-3" />
                Read
              </span>
            ) : (
              <span>Sent</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      {/* Thread Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          <p className="text-sm text-gray-600">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Archive className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
            <p className="text-gray-600 mb-4">
              Start the conversation by sending your first message.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id || index} 
                message={message} 
                isOwn={currentUserId ? message.sender_id === currentUserId : message.sender === 'candidate'} 
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Context */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Replying to {replyingTo.senderName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setReplyingTo(null)}
              className="text-blue-600"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-blue-700 mt-1 truncate pl-6">
            {replyingTo.message}
          </p>
        </div>
      )}

      {/* File Attachments Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.name)}
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type your message..."}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Send Button */}
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isLoading || disabled}
            className="px-4 py-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="xs">
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Emoji Picker (Basic) */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <div className="grid grid-cols-6 gap-2">
            {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg hover:bg-gray-100 p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MessageThread;
