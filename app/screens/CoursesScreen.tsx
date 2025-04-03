import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CoursesScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Courses Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CoursesScreen; 