import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CourseDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Course Detail Screen</Text>
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

export default CourseDetailScreen; 