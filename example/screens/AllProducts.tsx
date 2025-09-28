import {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SectionList,
} from 'react-native';
import {useIAP} from 'react-native-iap';
import Loading from '../src/components/Loading';
import {
  PRODUCT_IDS,
  SUBSCRIPTION_PRODUCT_IDS,
  CONSUMABLE_PRODUCT_IDS,
  NON_CONSUMABLE_PRODUCT_IDS,
} from '../src/utils/constants';
import type {Product} from 'react-native-iap';

const ALL_PRODUCT_IDS = [...PRODUCT_IDS, ...SUBSCRIPTION_PRODUCT_IDS];

/**
 * All Products Example - Show All Products and Subscriptions
 *
 * Demonstrates fetching all products (both in-app and subscriptions):
 * - Uses fetchProducts with 'all' type to get everything
 * - Displays products and subscriptions as they come from the API
 * - Single view for all product types
 */

function AllProducts() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const {connected, products, subscriptions, fetchProducts} = useIAP();

  useEffect(() => {
    console.log('[AllProducts] useEffect - connected:', connected);
    console.log('[AllProducts] Current products:', products.length);
    console.log('[AllProducts] Current subscriptions:', subscriptions.length);

    if (connected) {
      console.log(
        '[AllProducts] Fetching all products with SKUs:',
        ALL_PRODUCT_IDS,
      );

      // Fetch all products with type 'all'
      fetchProducts({skus: ALL_PRODUCT_IDS, type: 'all'})
        .then(() => {
          console.log('[AllProducts] fetchProducts completed');
          console.log('[AllProducts] Products after fetch:', products.length);
          console.log(
            '[AllProducts] Subscriptions after fetch:',
            subscriptions.length,
          );
        })
        .catch((error) => {
          console.error('[AllProducts] fetchProducts error:', error);
        });
    }
  }, [connected, fetchProducts]);

  // Prepare sections for SectionList
  const sections = useMemo(() => {
    const sectionsData = [];

    if (products.length > 0) {
      sectionsData.push({
        title: 'In-App Products',
        data: products,
      });
    }

    if (subscriptions.length > 0) {
      sectionsData.push({
        title: 'Subscriptions',
        data: subscriptions,
      });
    }

    return sectionsData;
  }, [products, subscriptions]);

  const handleShowDetails = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const getProductTypeLabel = (product: Product) => {
    if (CONSUMABLE_PRODUCT_IDS.includes(product.id)) {
      return 'CONSUMABLE';
    }
    if (NON_CONSUMABLE_PRODUCT_IDS.includes(product.id)) {
      return 'NON-CONSUMABLE';
    }
    return 'IN-APP';
  };

  const getProductTypeStyle = (product: Product) => {
    if (CONSUMABLE_PRODUCT_IDS.includes(product.id)) {
      return styles.typeBadgeConsumable;
    }
    if (NON_CONSUMABLE_PRODUCT_IDS.includes(product.id)) {
      return styles.typeBadgeNonConsumable;
    }
    return styles.typeBadgeInApp;
  };

  // Show loading screen while disconnected
  if (!connected) {
    return <Loading message="Connecting to Store..." />;
  }

  const renderItem = ({item}: {item: Product}) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productTitleContainer}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text
            style={[
              styles.typeBadge,
              item.type === 'subs'
                ? styles.typeBadgeSubscription
                : getProductTypeStyle(item),
            ]}
          >
            {item.type === 'subs' ? 'SUBSCRIPTION' : getProductTypeLabel(item)}
          </Text>
        </View>
        <Text style={styles.productPrice}>{item.displayPrice}</Text>
      </View>
      <Text style={styles.productDescription}>{item.description}</Text>
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => handleShowDetails(item)}
      >
        <Text style={styles.detailsButtonText}>Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = ({section}: {section: {title: string}}) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {section.title === 'In-App Products'
          ? `${products.length} item(s)`
          : `${subscriptions.length} item(s)`}
      </Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>All Products</Text>
        <Text style={styles.subtitle}>In-App Purchases and Subscriptions</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Store Connection:</Text>
        <Text
          style={[
            styles.statusValue,
            {color: connected ? '#4CAF50' : '#F44336'},
          ]}
        >
          {connected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
      </View>
    </>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No products available</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      {/* Product Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Product Details</Text>
            {selectedProduct && (
              <>
                <Text style={styles.modalLabel}>Product ID:</Text>
                <Text style={styles.modalValue}>{selectedProduct.id}</Text>

                <Text style={styles.modalLabel}>Title:</Text>
                <Text style={styles.modalValue}>{selectedProduct.title}</Text>

                <Text style={styles.modalLabel}>Description:</Text>
                <Text style={styles.modalValue}>
                  {selectedProduct.description}
                </Text>

                <Text style={styles.modalLabel}>Price:</Text>
                <Text style={styles.modalValue}>
                  {selectedProduct.displayPrice}
                </Text>

                <Text style={styles.modalLabel}>Currency:</Text>
                <Text style={styles.modalValue}>
                  {selectedProduct.currency || 'N/A'}
                </Text>

                <Text style={styles.modalLabel}>Type:</Text>
                <Text style={styles.modalValue}>
                  {selectedProduct.type || 'N/A'}
                </Text>

                {'isFamilyShareableIOS' in selectedProduct && (
                  <>
                    <Text style={styles.modalLabel}>Is Family Shareable:</Text>
                    <Text style={styles.modalValue}>
                      {selectedProduct.isFamilyShareableIOS ? 'Yes' : 'No'}
                    </Text>
                  </>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default AllProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    margin: 15,
    marginTop: 0,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeBadgeInApp: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
  typeBadgeConsumable: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  typeBadgeNonConsumable: {
    backgroundColor: '#F3E5F5',
    color: '#6A1B9A',
  },
  typeBadgeSubscription: {
    backgroundColor: '#FFF8E1',
    color: '#F57C00',
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
