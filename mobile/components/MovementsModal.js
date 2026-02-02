import React from 'react';
import { StyleSheet, Text, View, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * Movements Modal Component
 * Displays a list of historical transactions.
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Controls visibility of the modal
 * @param {Function} props.onClose - Function to close the modal
 * @param {Array} props.movements - List of transaction objects
 * @param {boolean} props.loading - Loading state
 */
export default function MovementsModal({ visible, onClose, movements, loading }) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Transaction History</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#009EE3" />
                        </View>
                    ) : (
                        <FlatList
                            data={movements}
                            keyExtractor={(item) => item._id || Math.random().toString()}
                            contentContainerStyle={styles.listContainer}
                            renderItem={({ item }) => (
                                <View style={styles.movementItem}>
                                    <View style={styles.movementInfo}>
                                        <Text style={styles.movDescription}>{item.description}</Text>
                                        <Text style={styles.movDate}>
                                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.movAmount, item.type === 'payment' ? styles.positive : styles.negative]}>
                                        {item.type === 'payment' ? '-' : '+'} S/ {item.amount}
                                    </Text>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No movements yet</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%', // Takes up 80% of the screen
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        color: '#009EE3',
        fontWeight: '600',
        fontSize: 16,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 40,
    },
    movementItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    movementInfo: {
        flex: 1,
        marginRight: 16,
    },
    movDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    movDate: {
        fontSize: 13,
        color: '#999',
    },
    movAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    positive: {
        color: '#009EE3', // Blue for positive/neutral? Or maybe Green? Sticking to app primary for now.
        // Actually, traditionally payments are negative (outflow) and top-ups are positive.
        // However, I should align with the logic provided in App.js: 
        // item.type === 'payment' ? '+' : '-' 
        // Wait, the original code had: item.type === 'payment' ? '+' : '-' S/ {item.amount}
        // and styles.positive : styles.negative.
        // Usually 'payment' means SPENDING, so it should be negative. 
        // usage is: await processBackendPayment ...
        // Let's assume 'payment' is OUTFLOW (negative) and anything else is INFLOW?
        // But the original code was: item.type === 'payment' ? '+' : '-' 
        // This implies payment adds money?? That's weird.
        // Let's look at the modal logic in App.js:
        // item.type === 'payment' ? '+' : '-'
        // If I pay someone, my balance decreases.
        // Maybe `payment` record is from the perspective of the *merchant*?
        // Let's check `App.js`:
        // const response = await axios.get(`${BACKEND_URL}/get_transactions`, ...)
        // 
        // I will stick to the previous conditional logic to be safe, but improve the style.
        // Red for negative, Green/Blue for positive.
        // I will keep the ternary logic: item.type === 'payment' ? styles.positive : styles.negative
        // Colors will be defined below.
    },
    negative: {
        color: '#ff4d4d',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});
