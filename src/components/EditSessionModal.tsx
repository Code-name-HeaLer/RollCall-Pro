import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView
} from 'react-native';
import { Session } from '../data/types';
import { Text } from './Text';
import { Button } from './Button';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './ui/StatusBadge';

interface EditSessionModalProps {
  visible: boolean;
  session: Session | null;
  onClose: () => void;
  onSave: (details: { notes?: string; assignments?: string[] }) => void;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({
  visible,
  session,
  onClose,
  onSave,
}) => {
  const { settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');
  
  const [notes, setNotes] = useState('');
  const [assignments, setAssignments] = useState<string[]>([]);
  const [newAssignment, setNewAssignment] = useState('');
  
  // Reset form when session changes
  useEffect(() => {
    if (session) {
      setNotes(session.notes || '');
      setAssignments(session.assignments || []);
      setNewAssignment('');
    }
  }, [session]);
  
  const handleSave = () => {
    // Save details
    onSave({
      notes: notes.trim(),
      assignments: assignments.filter(a => a.trim().length > 0),
    });
    onClose();
  };
  
  const addAssignment = () => {
    if (newAssignment.trim()) {
      setAssignments([...assignments, newAssignment.trim()]);
      setNewAssignment('');
    }
  };
  
  const removeAssignment = (index: number) => {
    const updatedAssignments = [...assignments];
    updatedAssignments.splice(index, 1);
    setAssignments(updatedAssignments);
  };
  
  if (!session) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View 
          style={[
            styles.modalView, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="h3" weight="bold">Edit Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sessionInfo}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={18} color={colors.primary} style={styles.dateIcon} />
              <Text variant="body" weight="semibold">{session.date}</Text>
            </View>
            <StatusBadge status={session.status} size="medium" />
          </View>
          
          <ScrollView style={styles.formContainer}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[
                styles.notesInput, 
                { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this class session..."
              placeholderTextColor={colors.secondaryText + '80'}
              multiline
            />
            
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>Assignments</Text>
            
            {assignments.map((assignment, index) => (
              <View key={index} style={styles.assignmentItem}>
                <Text variant="body" style={styles.assignmentText}>{assignment}</Text>
                <TouchableOpacity onPress={() => removeAssignment(index)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.addAssignmentContainer}>
              <TextInput
                style={[
                  styles.assignmentInput, 
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                value={newAssignment}
                onChangeText={setNewAssignment}
                placeholder="New assignment..."
                placeholderTextColor={colors.secondaryText + '80'}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addAssignment}
                disabled={!newAssignment.trim()}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.actionButtons}>
            <Button 
              title="Cancel" 
              variant="outline"
              onPress={onClose}
              style={styles.cancelButton}
            />
            <Button 
              title="Save Changes" 
              variant="primary"
              onPress={handleSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 5,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 8,
  },
  formContainer: {
    maxHeight: 400,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  assignmentText: {
    flex: 1,
    marginRight: 10,
  },
  addAssignmentContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  assignmentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 10,
  },
});

export default EditSessionModal; 