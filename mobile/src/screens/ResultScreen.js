import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import api from '../api/api';

export default function ResultScreen({ route }) {
  const pollParam = route.params?.poll;
  const pollId = route.params?.poll?._id;
  const [poll, setPoll] = useState(pollParam || null);

  const load = async () => {
    if (pollId) {
      const res = await api.get(`/polls/${pollId}`);
      setPoll(res.data);
    }
  };

  useEffect(() => { if (!poll) load(); }, []);

  if (!poll) return <View><Text>Loading results...</Text></View>;

  const labels = poll.options.map(o => o.text.length > 10 ? o.text.slice(0, 10) + '...' : o.text);
  const counts = poll.options.map((o, idx) => poll.votes.filter(v => v.optionIndex === idx).length);

  const screenWidth = Dimensions.get('window').width;

  return (
    <View>
      <Text style={{ fontSize: 18, margin: 10 }}>{poll.title}</Text>
      <BarChart
        data={{
          labels,
          datasets: [{ data: counts }]
        }}
        width={screenWidth - 20}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0,0,0, ${opacity})`
        }}
        verticalLabelRotation={30}
      />
      <Text style={{ margin: 10 }}>Total votes: {poll.votes.length}</Text>
    </View>
  );
}
