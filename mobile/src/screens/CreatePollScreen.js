import { TextInput, Button, Text, HelperText, Card, Switch } from 'react-native-paper';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import api from '../api/api';

export default function CreatePollScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [optionsText, setOptionsText] = useState(''); // user enters options separated by new line or comma
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);


  const parseOptions = (text) => {
    // split by new line or comma, trim and remove empties
    return text
      .split(/\n|,/)
      .map(o => o.trim())
      .filter(Boolean);
  };

  const onCreate = async () => {
    const options = parseOptions(optionsText);
    if (!title.trim()) { setError('Title is required'); return; }
    if (options.length < 2) { setError('Add at least two options (comma or new line separated)'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/polls', { title: title.trim(), options, allowMultipleVotes });
      // console.log(res);

      setLoading(false);
      navigation.navigate('Home', { newPollId: res.data._id });
    } catch (err) {
      setLoading(false);
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to create poll');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={{ marginBottom: 12 }}>Create New Poll</Text>

          <TextInput
            label="Poll title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={{ marginBottom: 12 }}
          />
          <TextInput
            label="Options (one per line or comma separated)"
            value={optionsText}
            onChangeText={setOptionsText}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={{ marginBottom: 12 }}
          />
          {error ? <HelperText type="error">{error}</HelperText> : null}

          {/* multiple vote option */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>Allow multiple votes</Text>
            <Switch value={allowMultipleVotes} onValueChange={setAllowMultipleVotes} />
          </View>


          <Button mode="contained" onPress={onCreate} loading={loading} disabled={loading}>
            Create Poll
          </Button>
          <Button style={{ marginTop: 8 }} onPress={() => navigation.goBack()}>
            Cancel
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 8 }
});
