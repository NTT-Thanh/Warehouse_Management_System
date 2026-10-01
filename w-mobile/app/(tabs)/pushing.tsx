import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type PushItem = {
    id: string;          // id của putaway_task trong DB
    name: string;        // tên sản phẩm
    sku: string;         // mã SKU
    batch_name: string;  // mã lô hàng (từ bảng batches)
    required: number;    // số lượng cần cất
    picked: number;      // số lượng đã cất thực tế
};

const API_BASE_URL = 'http://10.181.145.212:3000/api'; 

export default function PutawayScreen() {
    const [items, setItems] = useState<PushItem[]>([]);
    const [orderCode, setOrderCode] = useState('Đang tải...');
    const [targetLocation, setTargetLocation] = useState('LOC-A1-01');
    const [locationScanned, setLocationScanned] = useState(false);
    const [status, setStatus] = useState<'Chờ xử lý' | 'Đang cất' | 'Hoàn thành'>('Chờ xử lý');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanMode, setScanMode] = useState<'location' | 'sku'>('location');
    const [permission, requestPermission] = useCameraPermissions();
    
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Nhận orderId (thực chất là receipt_id của phiếu nhập) từ trang danh sách truyền sang
    const TARGET_ORDER_ID = params.orderId ? String(params.orderId) : '1';

    useEffect(() => {
        fetch(`${API_BASE_URL}/push/order/${TARGET_ORDER_ID}`)
            .then((res) => res.json())
            .then((response) => {
                if (response.success && response.data.length > 0) {
                    setItems(response.data);
                    if (response.data[0].order_code) {
                        setOrderCode(response.data[0].order_code);
                    }
                    if (response.data[0].targetLocation) {
                        setTargetLocation(response.data[0].targetLocation);
                    }
                }
            })
            .catch((error) => {
                console.error('Lỗi kết nối API:', error);
                Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ backend.');
            });
    }, [TARGET_ORDER_ID]);

    const pickedTotal = items.reduce((total, item) => total + item.picked, 0);
    const requiredTotal = items.reduce((total, item) => total + item.required, 0);
    const isComplete = locationScanned && items.length > 0 && items.every((item) => item.picked >= item.required);

    const openScanner = (mode: 'location' | 'sku') => {
        setScanMode(mode);
        setScannerOpen(true);
        if (status === 'Chờ xử lý') setStatus('Đang cất');
    };

    const updateTaskOnServer = async (taskId: string, newPickedQty: number) => {
        try {
            await fetch(`${API_BASE_URL}/push/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Gửi kèm dữ liệu cập nhật theo backend mới
                body: JSON.stringify({ putaway_quantity: newPickedQty, actual_bin_id: 1 }), 
            });
        } catch (error) {
            console.error('Lỗi cập nhật DB:', error);
        }
    };

    const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
        setScannerOpen(false);

        // 1. Quét vị trí cất hàng (Location / Bin)
        if (scanMode === 'location') {
            if (data.toUpperCase() === targetLocation.toUpperCase()) {
                setLocationScanned(true);
                Alert.alert('Đúng vị trí', `Ô ${data} đã được xác nhận. Tiến hành quét SKU sản phẩm để cất.`);
            } else {
                Alert.alert('Sai vị trí', `Mã quét (${data}) không khớp với vị trí cần cất (${targetLocation}).`);
            }
            return;
        }

        // 2. Quét SKU sản phẩm để tăng số lượng đưa lên kệ
        const itemIndex = items.findIndex((item) => item.sku.toUpperCase() === data.toUpperCase());
        if (itemIndex < 0) {
            Alert.alert('SKU không hợp lệ', `Không tìm thấy mã sản phẩm ${data} trong phiếu nhập này.`);
            return;
        }

        const item = items[itemIndex];
        if (item.picked >= item.required) {
            Alert.alert('Đã đủ số lượng', `Sản phẩm ${item.name} (Lô: ${item.batch_name}) đã đủ ${item.required} cái.`);
            return;
        }

        const newPickedQty = item.picked + 1;

        setItems((currentItems) =>
            currentItems.map((currentItem, index) =>
                index === itemIndex ? { ...currentItem, picked: newPickedQty } : currentItem,
            ),
        );

        updateTaskOnServer(item.id, newPickedQty);
    };

    const finishTask = () => {
        if (!isComplete) return;
        setStatus('Hoàn thành');
        Alert.alert('Đã hoàn thành', 'Task cất hàng đã được xác nhận hoàn tất.');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.eyebrow}>PHIẾU NHẬP KHO / CẤT HÀNG (PUTAWAY)</Text>
                    <Text style={styles.orderCode}>{orderCode}</Text>
                </View>
                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, status === 'Hoàn thành' && styles.statusDotDone]} />
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.progressRow}>
                    <View>
                        <Text style={styles.sectionLabel}>TIẾN ĐỘ CẤT HÀNG</Text>
                        <Text style={styles.progressValue}>{pickedTotal}/{requiredTotal || 0} sản phẩm</Text>
                    </View>
                    <Text style={styles.progressPercent}>
                        {requiredTotal > 0 ? Math.round((pickedTotal / requiredTotal) * 100) : 0}%
                    </Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${requiredTotal > 0 ? (pickedTotal / requiredTotal) * 100 : 0}%` }]} />
                </View>

                <View style={styles.locationCard}>
                    <View style={styles.locationTopLine}>
                        <View style={styles.locationIcon}>
                            <MaterialIcons name="move-to-inbox" size={23} color="#F7B84B" />
                        </View>
                        <View style={styles.locationCopy}>
                            <Text style={styles.sectionLabel}>VỊ TRÍ CẤT VÀO KHO</Text>
                            <Text style={styles.locationBin}>{targetLocation}</Text>
                        </View>
                        {locationScanned && <MaterialIcons name="verified" size={26} color="#36C98F" />}
                    </View>
                    <View style={styles.locationDivider} />
                    <View style={styles.locationActions}>
                        <Text style={styles.locationCode}>{locationScanned ? 'Đã xác nhận vị trí' : 'Chưa quét vị trí'}</Text>
                        <Pressable style={styles.mapButton} onPress={() => Alert.alert('Bản đồ kho', `Di chuyển hàng đến ô: ${targetLocation}`)}>
                            <MaterialIcons name="map" size={18} color="#112C3E" />
                            <Text style={styles.mapButtonText}>Xem bản đồ</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.itemsHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm cần cất</Text>
                    <Text style={styles.itemsCount}>{items.length} mặt hàng</Text>
                </View>
                <View style={styles.itemList}>
                    {items.map((item, index) => {
                        const itemDone = item.picked >= item.required;
                        return (
                            <View key={`${item.id}-${index}`} style={styles.itemRow}>
                                <View style={[styles.checkBox, itemDone && styles.checkBoxDone]}>
                                    {itemDone && <MaterialIcons name="check" size={17} color="#fff" />}
                                </View>
                                <View style={styles.itemCopy}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {/* Hiển thị chi tiết SKU và Lô hàng khớp với bảng batches */}
                                    <Text style={styles.sku}>
                                        SKU: {item.sku} | Lô: <Text style={styles.batchHighlight}>{item.batch_name}</Text>
                                    </Text>
                                </View>
                                <View style={styles.quantityBox}>
                                    <Text style={[styles.quantityValue, itemDone && styles.quantityDone]}>{item.picked}/{item.required}</Text>
                                    <Text style={styles.quantityLabel}>cái</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
                <Text style={styles.helperText}>Quét mã vị trí kệ, sau đó quét mã SKU sản phẩm để tăng số lượng cất vào.</Text>
            </ScrollView>

            <View style={styles.bottomActions}>
                <Pressable style={styles.scanButton} onPress={() => openScanner(locationScanned ? 'sku' : 'location')}>
                    <MaterialIcons name="qr-code-scanner" size={25} color="#fff" />
                    <View>
                        <Text style={styles.scanButtonText}>{locationScanned ? 'Quét mã SKU sản phẩm' : 'Quét mã vị trí kệ'}</Text>
                        <Text style={styles.scanButtonHint}>{locationScanned ? 'Quét đưa hàng lên kệ' : 'Xác nhận vị trí trước'}</Text>
                    </View>
                </Pressable>
                <Pressable style={[styles.finishButton, !isComplete && styles.finishButtonDisabled]} onPress={finishTask} disabled={!isComplete}>
                    <Text style={styles.finishButtonText}>Hoàn thành Task Cất Hàng</Text>
                    <MaterialIcons name="arrow-forward" size={21} color={isComplete ? '#112C3E' : '#9AA9B1'} />
                </Pressable>
            </View>

            <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
                <View style={styles.scannerScreen}>
                    {permission?.granted ? (
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            facing="back"
                            barcodeScannerSettings={{ barcodeTypes: ['code128', 'qr', 'ean13', 'ean8'] }}
                            onBarcodeScanned={handleBarcodeScanned}
                        />
                    ) : (
                        <View style={styles.permissionPanel}>
                            <MaterialIcons name="photo-camera" size={48} color="#F7B84B" />
                            <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
                            <Text style={styles.permissionText}>Camera dùng để quét mã vị trí ô kệ và mã SKU sản phẩm nhập kho.</Text>
                            <Pressable style={styles.permissionButton} onPress={requestPermission}>
                                <Text style={styles.permissionButtonText}>Cho phép camera</Text>
                            </Pressable>
                        </View>
                    )}
                    <View style={styles.scannerOverlay} pointerEvents="box-none">
                        <View style={styles.scannerTopBar}>
                            <Pressable onPress={() => setScannerOpen(false)} hitSlop={12}>
                                <MaterialIcons name="close" size={30} color="#fff" />
                            </Pressable>
                            <Text style={styles.scannerTitle}>{scanMode === 'location' ? 'Quét mã vị trí kệ' : 'Quét mã SKU sản phẩm'}</Text>
                            <View style={{ width: 30 }} />
                        </View>
                        {permission?.granted && (
                            <View style={styles.scanFrame}>
                                <View style={[styles.corner, styles.cornerTopLeft]} />
                                <View style={[styles.corner, styles.cornerTopRight]} />
                                <View style={[styles.corner, styles.cornerBottomLeft]} />
                                <View style={[styles.corner, styles.cornerBottomRight]} />
                            </View>
                        )}
                        <Text style={styles.scannerHint}>{scanMode === 'location' ? 'Đưa mã vị trí kệ vào khung quét' : 'Đưa mã SKU sản phẩm vào khung quét'}</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
    header: { backgroundColor: '#112C3E', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eyebrow: { color: '#9CB0B8', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
    orderCode: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
    statusPill: { backgroundColor: '#23465A', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F7B84B', marginRight: 7 },
    statusDotDone: { backgroundColor: '#36C98F' },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    content: { padding: 20, paddingBottom: 18 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    sectionLabel: { color: '#71848D', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
    progressValue: { color: '#112C3E', fontSize: 16, fontWeight: '800', marginTop: 4 },
    progressPercent: { color: '#19866C', fontSize: 18, fontWeight: '800' },
    progressTrack: { height: 7, backgroundColor: '#DCE6E4', borderRadius: 5, marginTop: 10, marginBottom: 22, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#36C98F', borderRadius: 5 },
    locationCard: { backgroundColor: '#112C3E', borderRadius: 16, padding: 17, marginBottom: 24 },
    locationTopLine: { flexDirection: 'row', alignItems: 'flex-start' },
    locationIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#23465A', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    locationCopy: { flex: 1 },
    locationBin: { color: '#F7B84B', fontSize: 24, fontWeight: '900', marginTop: 1 },
    locationDivider: { height: 1, backgroundColor: '#315467', marginVertical: 15 },
    locationActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationCode: { color: '#9CB0B8', fontSize: 12, fontWeight: '600' },
    mapButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7B84B', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
    mapButtonText: { color: '#112C3E', fontSize: 12, fontWeight: '800', marginLeft: 5 },
    itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
    sectionTitle: { color: '#112C3E', fontSize: 19, fontWeight: '900' },
    itemsCount: { color: '#71848D', fontSize: 12, fontWeight: '700' },
    itemList: { backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15 },
    itemRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF1F0' },
    checkBox: { width: 25, height: 25, borderRadius: 7, borderWidth: 2, borderColor: '#CBD9D7', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    checkBoxDone: { backgroundColor: '#36C98F', borderColor: '#36C98F' },
    itemCopy: { flex: 1, paddingRight: 8 },
    itemName: { color: '#112C3E', fontSize: 14, fontWeight: '800' },
    sku: { color: '#82939A', fontSize: 11, marginTop: 5, fontWeight: '600' },
    batchHighlight: { color: '#112C3E', fontWeight: '900' },
    quantityBox: { alignItems: 'flex-end', minWidth: 46 },
    quantityValue: { color: '#112C3E', fontSize: 17, fontWeight: '900' },
    quantityDone: { color: '#19866C' },
    quantityLabel: { color: '#82939A', fontSize: 10, marginTop: 2 },
    helperText: { color: '#82939A', fontSize: 12, textAlign: 'center', marginTop: 12 },
    bottomActions: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: '#F4F7F6', borderTopWidth: 1, borderTopColor: '#E2EBE8', gap: 10 },
    scanButton: { minHeight: 62, borderRadius: 14, backgroundColor: '#19866C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
    scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    scanButtonHint: { color: '#C3E8DC', fontSize: 11, marginTop: 2 },
    finishButton: { minHeight: 53, borderRadius: 13, backgroundColor: '#F7B84B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    finishButtonDisabled: { backgroundColor: '#E1E8E6' },
    finishButtonText: { color: '#112C3E', fontSize: 15, fontWeight: '900' },
    scannerScreen: { flex: 1, backgroundColor: '#07151C' },
    scannerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center' },
    scannerTopBar: { width: '100%', paddingHorizontal: 20, paddingTop: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    scanFrame: { width: '78%', aspectRatio: 1.35, marginTop: '42%', position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#F7B84B' },
    cornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    cornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    scannerHint: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 22 },
    permissionPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    permissionTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 18, textAlign: 'center' },
    permissionText: { color: '#B8C9CE', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21 },
    permissionButton: { backgroundColor: '#F7B84B', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, marginTop: 22 },
    permissionButtonText: { color: '#112C3E', fontSize: 14, fontWeight: '900' },
});