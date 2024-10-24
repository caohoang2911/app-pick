import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  options: Array<{
    label: string,
    value: string
  }>,
  selected: string,
  onSelect: (value: string, index: number) => void
}

const Segmented = (
  {
    options,
    selected,
    onSelect
  }: Props) => {


    const handleSelect = (value: string, index: number) => {
        onSelect(value, index);
    };

    return (
        <View style={styles.container}>
            {options.map((option, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.button,
                        selected === option.value && styles.selectedButton
                    ]}
                    onPress={() => handleSelect(option.value, index)}
                >
                    <Text style={[
                      styles.buttonText,
                      selected === option.value && styles.selectedButtonText
                    ]}>{option.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

// Update styles to remove indicator
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#dfdfdf',
        borderRadius: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    button: {
        flex: 1,
        padding: 5,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#007BFF',
    },
    buttonText: {
        color: '#000',
        fontWeight: "semibold",
    },
    selectedButtonText: {
        color: '#fff',
        fontWeight: "bold",
    },
});

export default Segmented;
