import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Title, Paragraph, FAB, ActivityIndicator } from 'react-native-paper';
import api from '../api/api';
import { AuthContext } from '../navigation/AuthProvider';

export default function HomeScreen({ navigation, route }) {
  const { signOut, user } = useContext(AuthContext);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/polls');
      setPolls(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // refresh
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Poll', { pollId: item._id })}>
        <Card style={styles.card}>
          <Card.Content>
            <Title numberOfLines={1}>{item.title}</Title>
            <Paragraph>By: {item.createdBy?.name || 'Unknown'} • {item.votes?.length || 0} votes • {item.options?.length} options</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={{ fontSize: 18 }}>Welcome, {user?.name}</Text>
        <Button onPress={signOut}>Sign out</Button>
      </View>

      {/* <View style={styles.actionRow}>
        <Button icon="chart-bar" mode="outlined" onPress={() => navigation.navigate('Results')}>Results</Button>
        <Button icon="comment" mode="outlined" onPress={() => navigation.navigate('Comments')}>Comments</Button>
      </View> */}

      {loading ? (
        <ActivityIndicator animating size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList data={polls} renderItem={renderItem} keyExtractor={(i) => i._id} contentContainerStyle={{ padding: 12 }} />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="Create Poll"
        onPress={() => navigation.navigate('CreatePoll')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  card: { marginBottom: 10 },
  fab: { position: 'absolute', right: 16, bottom: 20 }
});
