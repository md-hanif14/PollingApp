import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import api from '../api/api';

export default function CommentScreen({ route }) {
  const pollId = route.params?.pollId;
  const [poll, setPoll] = useState(null);
  const [text, setText] = useState('');

  const load = async () => {
    const res = await api.get(`/polls/${pollId}`);
    setPoll(res.data);
  };

  useEffect(() => { load(); }, []);

  const addComment = async () => {
    try {
      await api.post(`/polls/${pollId}/comment`, { text });
      setText('');
      load();
    } catch (err) {
      alert(err.response?.data?.msg || 'Comment failed');
    }
  };

  if (!poll) return <View><Text>Loading...</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <TextInput placeholder="Write a comment" value={text} onChangeText={setText} style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Send" onPress={addComment} />

      <FlatList
        data={poll.comments}
        keyExtractor={(c, i) => String(i)}
        renderItem={({ item }) => <View style={{ padding: 8, borderBottomWidth: 1 }}><Text>{item.text}</Text><Text style={{ fontSize: 12 }}>{item.user?.name || 'User'} - {new Date(item.createdAt).toLocaleString()}</Text></View>}
      />
    </View>
  );
}
