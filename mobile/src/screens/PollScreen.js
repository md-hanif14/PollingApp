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
  const [selectedOptions, setSelectedOptions] = useState([]); // multiple selection

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

      // if user already voted, prefill selectedOptions
      if (currentUser && res.data.votes.length > 0) {
        const myVotes = res.data.votes
          .filter(v => v.user === currentUser._id)
          .map(v => v.optionIndex);
        setSelectedOptions(myVotes);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load poll');
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchUserAndPoll = async () => {
      await loadUser();
      await loadPoll();
    };
    fetchUserAndPoll();
  }, []);

  if (loading || !poll) return <ActivityIndicator style={{ marginTop: 32 }} />;

  const counts = poll.options.map((opt, idx) => poll.votes.filter(v => v.optionIndex === idx).length);
  const total = poll.votes.length;

  const myVote = currentUser ? poll.votes.find(v => v.user === currentUser._id) : null;

  // handle selection
  const toggleOption = (index) => {
    if (poll.allowMultipleVotes) {
      if (selectedOptions.includes(index)) {
        setSelectedOptions(selectedOptions.filter(i => i !== index));
      } else {
        setSelectedOptions([...selectedOptions, index]);
      }
    } else {
      setSelectedOptions([index]); // single vote
    }
  };

  const submitVote = async () => {
    if (!currentUser) {
      Alert.alert('Not signed in', 'Please sign in to vote');
      return;
    }
    if (!poll.allowMultipleVotes && myVote) {
      Alert.alert('Already voted', 'You have already voted in this poll.');
      return;
    }
    if (selectedOptions.length === 0) {
      Alert.alert('No selection', 'Please select at least one option.');
      return;
    }

    setVoting(true);
    try {
      // if multiple, send all indexes one by one 
      for (let idx of selectedOptions) {
        await api.post(`/polls/${pollId}/vote`, { optionIndex: idx });
      }
      await loadPoll();
      Alert.alert('Vote submitted', 'Your vote(s) have been recorded.');
    } catch (err) {
      // console.error(err);
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

      {poll.options.map((opt, idx) => {
        const isSelected = selectedOptions.includes(idx);
        return (
          <Card key={idx} style={{ marginBottom: 8 }}>
            <Card.Content
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16 }}>{opt.text}</Text>
                <Paragraph>{counts[idx]} votes</Paragraph>
              </View>

              {myVote && !poll.allowMultipleVotes ? (
                // single vote
                myVote.optionIndex === idx ? <Chip icon="check">Your vote</Chip> : <Chip> </Chip>
              ) : (
                <Button
                  mode={isSelected ? 'contained' : 'outlined'}
                  onPress={() => toggleOption(idx)}
                  loading={voting}
                  disabled={voting || (myVote && !poll.allowMultipleVotes)}
                >
                  {isSelected ? 'Selected' : 'Vote'}
                </Button>
              )}
            </Card.Content>
          </Card>
        );
      })}

      <Button
        style={{ marginTop: 12 }}
        mode="contained"
        onPress={submitVote}
        disabled={voting || selectedOptions.length === 0 || (myVote && !poll.allowMultipleVotes)}
      >
        Submit Vote
      </Button>

      <Button
        style={{ marginTop: 12 }}
        mode="outlined"
        onPress={() => navigation.navigate('Results', { poll })}
      >
        View Results
      </Button>

      <Button style={{ marginTop: 8 }} onPress={() => navigation.navigate('Comments', { pollId })}>
        Comments ({poll.comments.length})
      </Button>
    </View>
  );
}
