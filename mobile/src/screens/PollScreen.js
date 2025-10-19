import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, ActivityIndicator, Chip } from 'react-native-paper';
import api from '../api/api';
import { AuthContext } from '../navigation/AuthProvider';

export default function PollScreen({ route, navigation }) {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {

      console.error('me error', err);
    }
  };

  const loadPoll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/polls/${pollId}`);
      setPoll(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load poll');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    loadPoll();
  }, []);

  if (loading || !poll) return <ActivityIndicator style={{ marginTop: 32 }} />;

  // prepare counts
  const counts = poll.options.map((opt, idx) => poll.votes.filter(v => v.optionIndex === idx).length);
  const total = poll.votes.length;

  // detect if current user already voted
  const myVote = currentUser ? poll.votes.find(v => v.user === currentUser._id) : null;
  const myVoteIndex = myVote ? myVote.optionIndex : null;

  const onVote = async (index) => {
    if (!currentUser) {
      Alert.alert('Not signed in', 'Please sign in to vote');
      return;
    }
    if (myVote) {
      Alert.alert('Already voted', 'You have already voted in this poll.');
      return;
    }
    setVoting(true);
    try {
      const res = await api.post(`/polls/${pollId}/vote`, { optionIndex: index });
      setPoll(res.data.poll || res.data); // server returns updated poll in new implementation

      await loadPoll();
    } catch (err) {
      console.error(err);
      Alert.alert('Vote failed', err.response?.data?.msg || 'Vote failed');
    }
    setVoting(false);
  };

  return (
    <View style={{ padding: 16 }}>
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Title>{poll.title}</Title>
          <Paragraph style={{ marginTop: 8 }}>{total} votes</Paragraph>
        </Card.Content>
      </Card>

      {poll.options.map((opt, idx) => (
        <Card key={idx} style={{ marginBottom: 8 }}>
          <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{opt.text}</Text>
              <Paragraph>{counts[idx]} votes</Paragraph>
            </View>

            {myVote ? (
              // show the user's chosen option with a chip
              myVoteIndex === idx ? <Chip icon="check">Your vote</Chip> : <Chip> </Chip>
            ) : (
              <Button mode="contained" onPress={() => onVote(idx)} loading={voting} disabled={voting}>
                Vote
              </Button>
            )}
          </Card.Content>
        </Card>
      ))}

      <Button style={{ marginTop: 12 }} mode="outlined" onPress={() => navigation.navigate('Results', { poll })}>
        View Results
      </Button>

      <Button style={{ marginTop: 8 }} onPress={() => navigation.navigate('Comments', { pollId })}>
        Comments ({poll.comments.length})
      </Button>
    </View>
  );
}
