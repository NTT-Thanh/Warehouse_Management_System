import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import apiClient from '@/services/api';
import { useAuth } from '@/services/auth/AuthContext';

type PickingTaskSummary = {
    task_id: string | number;
    order_id: string | number;
    order_code: string;
    name: string;
    sku: string;
    required: number;
    picked: number;
    primary_location: string;
    status: string;
};

export default function PickingListScreen() {
    const [tasks, setTasks] = useState<PickingTaskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user, signOut } = useAuth();
    const pickerId = user?.id;

    useFocusEffect(useCallback(() => {
        let isActive = true;
        if (!pickerId) return () => { isActive = false; };

        setLoading(true);
        Promise.resolve()
            .then(() => apiClient.get(`/picking_task/tasks/picker/${pickerId}`))
            .then(({ data }) => {
                if (!data.success) throw new Error(data.message || 'Không thể tải danh sách nhiệm vụ Picking.');
                if (isActive) setTasks(data.data);
            })
            .catch((error) => {
                console.error('Lỗi tải danh sách task:', error);
                if (isActive) Alert.alert('Lỗi', 'Không thể tải danh sách nhiệm vụ Picking.');
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => { isActive = false; };
    }, [pickerId]));

    const handleSelectTask = (taskId: string | number) => {
        router.push(`/picking?taskId=${taskId}`);
    };

    const onRefresh = async () => {
        if (!user?.id || refreshing) return;
        setRefreshing(true);
        try {
            const { data } = await apiClient.get(`/picking_task/tasks/picker/${user.id}`);
            if (data.success) setTasks(data.data);
            else throw new Error(data.message || 'Không thể tải danh sách nhiệm vụ Picking.');
        } catch (error) {
            console.error('Lỗi làm mới danh sách task:', error);
            Alert.alert('Lỗi', 'Không thể làm mới danh sách nhiệm vụ Picking.');
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#19866C" />
                <Text style={styles.loadingText}>Đang tải danh sách nhiệm vụ...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.eyebrow}>NHIỆM VỤ CỦA TÔI</Text>
                        <Text style={styles.headerTitle}>Danh sách task cần lấy</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable accessibilityRole="button" style={styles.refreshButton} onPress={() => void onRefresh()} disabled={refreshing}>
                            <MaterialIcons name="refresh" size={17} color="#D5E4E5" />
                            <Text style={styles.refreshText}>{refreshing ? 'Đang tải' : 'Làm mới'}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={signOut}>
                            <Text style={styles.signOutText}>Đăng xuất</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={(item) => String(item.task_id)}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} colors={['#19866C']} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="assignment-turned-in" size={54} color="#9AA9B1" />
                        <Text style={styles.emptyText}>Hiện không có nhiệm vụ nào được gân cho bạn.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable style={styles.taskCard} onPress={() => handleSelectTask(item.task_id)}>
                        <View style={styles.cardHeader}>
                            <View style={styles.orderCodeBox}>
                                <MaterialIcons name="assignment" size={18} color="#19866C" />
                                <Text style={styles.orderCodeText}>{item.order_code}</Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{item.status || 'Chờ xử lý'}</Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.infoRow}>
                                <MaterialIcons name="inventory-2" size={16} color="#71848D" />
                                <Text style={styles.infoText}>{item.name} (<Text style={styles.boldText}>{item.sku}</Text>)</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <MaterialIcons name="location-on" size={16} color="#F7B84B" />
                                <Text style={styles.infoText}>Vị trí: <Text style={styles.boldText}>{item.primary_location}</Text></Text>
                            </View>
                            <Text style={styles.infoText}>Đã lấy: <Text style={styles.boldText}>{item.picked}/{item.required} cái</Text></Text>
                        </View>

                        <View style={styles.cardFooter}>
                            <Text style={styles.actionPrompt}>Bấm để bắt đầu lấy hàng</Text>
                            <MaterialIcons name="arrow-forward-ios" size={14} color="#19866C" />
                        </View>
                    </Pressable>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F6' },
    loadingText: { marginTop: 10, color: '#71848D', fontWeight: '600' },
    header: { backgroundColor: '#112C3E', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
    refreshText: { color: '#D5E4E5', fontSize: 12, fontWeight: '700' },
    eyebrow: { color: '#9CB0B8', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
    signOutText: { color: '#D5E4E5', fontSize: 13, fontWeight: '700' },
    listContainer: { padding: 16, gap: 14 },
    taskCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2EBE8', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderCodeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderCodeText: { color: '#112C3E', fontSize: 16, fontWeight: '900' },
    statusBadge: { backgroundColor: '#EBF8F4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#19866C', fontSize: 11, fontWeight: '800' },
    cardBody: { gap: 6, marginBottom: 14, borderTopWidth: 1, borderTopColor: '#F0F4F3', paddingTop: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { color: '#71848D', fontSize: 13 },
    boldText: { color: '#112C3E', fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F4F3', paddingTop: 10 },
    actionPrompt: { color: '#19866C', fontSize: 13, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
    emptyText: { color: '#71848D', fontSize: 14, textAlign: 'center', marginTop: 12 },
});