import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchField({ value, onChange, placeholder = 'Search' }: Props) {
  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChange}
      value={value}
      style={styles.search}
      inputStyle={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 0,
  },
  input: {
    fontSize: 16,
  },
});

