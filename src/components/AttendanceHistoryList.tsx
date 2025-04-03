import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Session } from '../data/types';
import { Card } from './Card';
import { Text } from './Text';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import StatusBadge from './ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import EditSessionModal from './EditSessionModal'; // Try adding extension

interface Props {
    sessions: Session[];
    courseId: string;
}

const AttendanceHistoryList: React.FC<Props> = ({ sessions, courseId }) => {
    const { updateSessionDetails, settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    const handleEditPress = (session: Session) => {
        setEditingSession(session);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingSession(null);
    };

    const handleSaveChanges = (details: { notes?: string; assignments?: string[] }) => {
        if (editingSession) {
            updateSessionDetails(courseId, editingSession.date, details);
        }
    };

    const renderSessionItem = ({ item }: { item: Session }) => {
        const hasDetails = item.notes || item.assignments?.length;
        return (
            <View style={[styles.sessionItem, { borderBottomColor: colors.border }]}>
                <View style={styles.sessionHeader}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar" size={16} color={colors.secondary} style={styles.dateIcon} />
                        <Text variant="body" weight="semibold">{item.date}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>
                
                <TouchableOpacity
                   style={[styles.notesButtonStyle, { backgroundColor: colors.primary + '15' }]}
                   onPress={() => handleEditPress(item)}
                   activeOpacity={0.7}
                >
                   <Ionicons 
                       name={hasDetails ? "pencil" : "add-circle-outline"} 
                       size={18} 
                       color={colors.primary} 
                   />
                   <Text 
                       style={{ color: colors.primary, marginLeft: 6 }} 
                       variant="button"
                    >
                      {hasDetails ? "Edit Notes/Assign." : "Add Notes/Assign."}
                   </Text>
                </TouchableOpacity>
                
                {item.notes && (
                    <View style={styles.notesContainer}>
                        <Text variant="caption" weight="semibold" color="secondaryText">
                            Notes:
                        </Text>
                        <Text variant="body2" color="text" style={styles.notesText}>
                            {item.notes}
                        </Text>
                    </View>
                )}
                
                {item.assignments && item.assignments.length > 0 && (
                    <View style={styles.assignmentsContainer}>
                        <Text variant="caption" weight="semibold" color="secondaryText">
                            Assignments:
                        </Text>
                        {item.assignments.map((assignment, index) => (
                            <View key={index} style={styles.assignmentItem}>
                                <Ionicons name="document-text-outline" size={14} color={colors.secondaryText} style={styles.assignmentIcon} />
                                <Text variant="body2" color="text">{assignment}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <Card title="Attendance History" elevation="small">
            {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={colors.border} style={styles.emptyIcon} />
                    <Text variant="body" color="secondaryText" align="center">
                        No attendance recorded yet
                    </Text>
                </View>
            ) : (
                <FlatList 
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={(item) => item.date}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
            
            <EditSessionModal 
                visible={modalVisible} 
                session={editingSession} 
                onClose={handleCloseModal} 
                onSave={handleSaveChanges} 
            />
        </Card>
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingTop: 5,
    },
    sessionItem: {
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 6,
    },
    notesButton: {
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    notesButtonStyle: {
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',   
        overflow: 'hidden', 
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    notesContainer: {
        marginTop: 4,
        marginBottom: 8,
    },
    notesText: {
        marginTop: 2,
        fontStyle: 'italic',
    },
    assignmentsContainer: {
        marginTop: 4,
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    assignmentIcon: {
        marginRight: 6,
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
    },
    emptyIcon: {
        marginBottom: 12,
    }
});

export default AttendanceHistoryList; 