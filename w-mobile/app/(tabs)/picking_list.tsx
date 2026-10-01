import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type PickingTaskSummary = {
    order_id: string | number;
    order_code: string;
    total_items: number;
    total_quantity: number;
    primary_location: string;
    status: string;
};

const API_BASE_URL = 'http://10.181.145.212:3000/api';
const CURRENT_PICKER_ID = '3'; // ID tài khoản đăng nhập hiện tại (Ví dụ: nhân viên số 3)

export default function PickingListScreen() {
    const [tasks, setTasks] = useState<PickingTaskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`${API_BASE_URL}/picking_task/tasks/picker/${CURRENT_PICKER_ID}`)
            .then((res) => res.json())
            .then((response) => {
                if (response.success) {
                    setTasks(response.data);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error('Lỗi tải danh sách task:', error);
                Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
                setLoading(false);
            });
    }, []);

    const handleSelectTask = (orderId: string | number) => {
        // Chuyển hướng sang màn hình picking và truyền orderId qua tham số đường dẫn (Query Params)
        router.push(`/picking?orderId=${orderId}`);
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
                <Text style={styles.eyebrow}>NHIỆM VỤ CỦA TÔI</Text>
                <Text style={styles.headerTitle}>Danh sách đơn cần lấy</Text>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={(item, index) => `${item.order_id}-${index}`}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="assignment-turned-in" size={54} color="#9AA9B1" />
                        <Text style={styles.emptyText}>Hiện không có nhiệm vụ nào được gân cho bạn.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable style={styles.taskCard} onPress={() => handleSelectTask(item.order_id)}>
                        <View style={styles.cardHeader}>
                            <View style={styles.orderCodeBox}>
                                <MaterialIcons name="receipt-long" size={18} color="#19866C" />
                                <Text style={styles.orderCodeText}>{item.order_code}</Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{item.status || 'Chờ xử lý'}</Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.infoRow}>
                                <MaterialIcons name="location-on" size={16} color="#F7B84B" />
                                <Text style={styles.infoText}>Vị trí chính: <Text style={styles.boldText}>{item.primary_location}</Text></Text>
                            </View>
                            <View style={styles.infoRow}>
                                <MaterialIcons name="inventory-2" size={16} color="#71848D" />
                                <Text style={styles.infoText}>Số mặt hàng: <Text style={styles.boldText}>{item.total_items} SKU</Text> ({item.total_quantity} cái)</Text>
                            </View>
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
    eyebrow: { color: '#9CB0B8', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
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