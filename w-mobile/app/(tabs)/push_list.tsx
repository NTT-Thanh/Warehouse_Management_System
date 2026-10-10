import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '@/services/api';
import { useAuth } from '@/services/auth/AuthContext';

type PutawayTaskItem = {
    order_id: number;
    order_code: string;
    supplier_name: string;
    total_items: number;
    total_quantity: number;
    primary_location: string;
    status: string;
};

export default function PushListScreen() {
    const [tasks, setTasks] = useState<PutawayTaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user, signOut } = useAuth();

    useEffect(() => {
        let isActive = true;
        if (!user?.id) return () => { isActive = false; };

        Promise.resolve()
            .then(() => apiClient.get(`/pushList/list/${user.id}`))
            .then(({ data }) => {
                if (isActive && data.success) setTasks(data.data);
                else if (isActive) throw new Error(data.message || 'Không thể tải danh sách nhiệm vụ cất hàng.');
            })
            .catch((error) => {
                console.error('Lỗi kết nối API danh sách cất hàng:', error);
                if (isActive) Alert.alert('Lỗi', 'Không thể tải danh sách nhiệm vụ cất hàng.');
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => { isActive = false; };
    }, [user?.id]);

    const onRefresh = () => {
        if (refreshing) return;
        setRefreshing(true);
        if (!user?.id) {
            setRefreshing(false);
            return;
        }

        apiClient.get(`/pushList/list/${user.id}`)
            .then(({ data }) => {
                if (data.success) setTasks(data.data);
                else throw new Error(data.message || 'Không thể tải danh sách nhiệm vụ cất hàng.');
            })
            .catch((error) => {
                console.error('Lỗi kết nối API danh sách cất hàng:', error);
                Alert.alert('Lỗi', 'Không thể làm mới danh sách nhiệm vụ cất hàng.');
            })
            .finally(() => setRefreshing(false));
    };

    const renderItem = ({ item }: { item: PutawayTaskItem }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/pushing', params: { orderId: item.order_id } })}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderCode}>{item.order_code}</Text>
                    <Text style={styles.supplierText}>NCC: {item.supplier_name}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MaterialIcons name="inventory-2" size={16} color="#71848D" />
                    <Text style={styles.infoText}>Số mặt hàng: <Text style={styles.boldText}>{item.total_items}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="add-box" size={16} color="#71848D" />
                    <Text style={styles.infoText}>Tổng số lượng: <Text style={styles.boldText}>{item.total_quantity} cái</Text></Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="place" size={16} color="#F7B84B" />
                    <Text style={styles.infoText}>Vị trí kệ: <Text style={[styles.boldText, { color: '#F7B84B' }]}>{item.primary_location}</Text></Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.actionText}>Tiến hành cất hàng</Text>
                <MaterialIcons name="chevron-right" size={20} color="#19866C" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.eyebrow}>DANH SÁCH NHIỆM VỤ</Text>
                        <Text style={styles.headerTitle}>Cất Hàng (Putaway)</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity accessibilityRole="button" style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
                            <MaterialIcons name="refresh" size={17} color="#D5E4E5" />
                            <Text style={styles.refreshText}>{refreshing ? 'Đang tải' : 'Làm mới'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button" onPress={signOut}>
                            <Text style={styles.signOutText}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#19866C" />
                    <Text style={styles.loadingText}>Đang tải danh sách phiếu nhập...</Text>
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.order_id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#19866C']} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="assignment-turned-in" size={56} color="#B5C4C0" />
                            <Text style={styles.emptyText}>Không có nhiệm vụ cất hàng nào được phân công.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
    header: { backgroundColor: '#112C3E', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
    refreshText: { color: '#D5E4E5', fontSize: 12, fontWeight: '700' },
    eyebrow: { color: '#9CB0B8', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 },
    signOutText: { color: '#D5E4E5', fontSize: 13, fontWeight: '700' },
    listContainer: { padding: 16, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderCode: { color: '#112C3E', fontSize: 18, fontWeight: '900' },
    supplierText: { color: '#71848D', fontSize: 12, fontWeight: '600', marginTop: 3 },
    statusBadge: { backgroundColor: '#EBF6F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { color: '#19866C', fontSize: 11, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#EDF1F0', marginVertical: 12 },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { color: '#52656E', fontSize: 13, fontWeight: '500' },
    boldText: { color: '#112C3E', fontWeight: '800' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F4F7F6' },
    actionText: { color: '#19866C', fontSize: 13, fontWeight: '800' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#71848D', fontSize: 13, marginTop: 10, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { color: '#71848D', fontSize: 14, textAlign: 'center', marginTop: 12, fontWeight: '600' },
});