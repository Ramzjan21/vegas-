import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Vegas Cafe database...');

  // Clear existing data in reverse relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 1. System Settings
  await prisma.systemSettings.create({
    data: {
      cafeName: 'Vegas Cafe & Lounge',
      address: "Toshkent shahri, Amir Temur shoh ko'chasi, 45-uy",
      phone: '+998 71 200 00 20',
      serviceFeePercent: 10,
      receiptHeader: 'VEGAS CAFE & LOUNGE ga xush kelibsiz!',
      receiptFooter: 'Tashrifingiz uchun minnatdormiz! Yana kutib qolamiz.',
      currency: "so'm",
    },
  });

  // 2. Users (Employees)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const waiterHash = await bcrypt.hash('waiter123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);
  const stockHash = await bcrypt.hash('stock123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordHash,
      fullName: 'Alisher Zokirov',
      role: 'ADMINISTRATOR',
      phone: '+998 90 123 45 67',
      isActive: true,
    },
  });

  const waiter1 = await prisma.user.create({
    data: {
      username: 'ofitsiant1',
      password: waiterHash,
      fullName: 'Jasur Aliyev',
      role: 'OFITSIANT',
      phone: '+998 91 234 56 78',
      isActive: true,
    },
  });

  const waiter2 = await prisma.user.create({
    data: {
      username: 'ofitsiant2',
      password: waiterHash,
      fullName: 'Malika Karimova',
      role: 'OFITSIANT',
      phone: '+998 93 345 67 89',
      isActive: true,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      username: 'kassir1',
      password: cashierHash,
      fullName: 'Dilnoza Rahimova',
      role: 'KASSIR',
      phone: '+998 94 456 78 90',
      isActive: true,
    },
  });

  const stockKeeper = await prisma.user.create({
    data: {
      username: 'omborchi1',
      password: stockHash,
      fullName: 'Sardor Umarov',
      role: 'OMBORCHI',
      phone: '+998 97 567 89 01',
      isActive: true,
    },
  });

  console.log('Users created successfully.');

  // 3. Categories
  const categoriesData = [
    { name: 'Taomlar', icon: 'Utensils', description: 'Issiq va maxsus Vegas taomlari', sortOrder: 1 },
    { name: 'Salatlar', icon: 'Salad', description: 'Yangi va mazali salatlar', sortOrder: 2 },
    { name: 'Fast Food', icon: 'Pizza', description: 'Burger, lavash va pitsalar', sortOrder: 3 },
    { name: 'Ichimliklar', icon: 'GlassWater', description: 'Salqin va yangi ichimliklar', sortOrder: 4 },
    { name: 'Qahva', icon: 'Coffee', description: 'Kofe va issiq choylar', sortOrder: 5 },
    { name: 'Shirinliklar', icon: 'Cake', description: 'Desertlar va shirinliklar', sortOrder: 6 },
  ];

  const categoryMap: Record<string, number> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.name] = created.id;
  }

  // 4. Inventory
  const inventoryItems = [
    { name: "Mol go'shti (Lahm)", category: 'Go\'sht', unit: 'kg', initialStock: 40, currentStock: 25.5, minStock: 10, pricePerUnit: 95000 },
    { name: 'Tovuq filesi', category: 'Go\'sht', unit: 'kg', initialStock: 30, currentStock: 18.0, minStock: 8, pricePerUnit: 48000 },
    { name: 'Pomidor', category: 'Sabzavot', unit: 'kg', initialStock: 25, currentStock: 4.2, minStock: 6, pricePerUnit: 16000 }, // LOW STOCK!
    { name: 'Bodring', category: 'Sabzavot', unit: 'kg', initialStock: 20, currentStock: 12.0, minStock: 5, pricePerUnit: 14000 },
    { name: 'Kartoshka', category: 'Sabzavot', unit: 'kg', initialStock: 50, currentStock: 32.0, minStock: 15, pricePerUnit: 6000 },
    { name: 'Pishloq Mozzarella', category: 'Sut mahsuloti', unit: 'kg', initialStock: 15, currentStock: 8.5, minStock: 5, pricePerUnit: 85000 },
    { name: 'Lavash xamiri', category: 'Non mahsuloti', unit: 'dona', initialStock: 100, currentStock: 65, minStock: 20, pricePerUnit: 2500 },
    { name: 'Burger bulochkasi', category: 'Non mahsuloti', unit: 'dona', initialStock: 80, currentStock: 12, minStock: 15, pricePerUnit: 3500 }, // LOW STOCK!
    { name: 'Qahva donalari (Arabica)', category: 'Qahva', unit: 'kg', initialStock: 10, currentStock: 6.8, minStock: 3, pricePerUnit: 180000 },
    { name: 'Sut 3.2%', category: 'Sut mahsuloti', unit: 'litr', initialStock: 30, currentStock: 5.0, minStock: 8, pricePerUnit: 12000 }, // LOW STOCK!
    { name: 'Coca-Cola 0.5L', category: 'Ichimlik', unit: 'dona', initialStock: 120, currentStock: 74, minStock: 24, pricePerUnit: 7000 },
    { name: 'Qaymoq 33%', category: 'Sut mahsuloti', unit: 'litr', initialStock: 12, currentStock: 7.5, minStock: 4, pricePerUnit: 45000 },
  ];

  const inventoryMap: Record<string, number> = {};
  for (const item of inventoryItems) {
    const created = await prisma.inventory.create({ data: item });
    inventoryMap[item.name] = created.id;

    // Create initial transaction record
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: created.id,
        userId: stockKeeper.id,
        type: 'IN',
        quantity: item.initialStock,
        cost: item.initialStock * item.pricePerUnit,
        note: 'Boshlang\'ich ombor qoldig\'i kiritildi',
      },
    });
  }

  // 5. Products (22 items with realistic images)
  const productsData = [
    // Taomlar
    {
      name: 'Vegas Ribeye Steyk',
      categoryId: categoryMap['Taomlar'],
      price: 135000,
      description: 'Maxsus pishirilgan yumshoq mol go\'shti steyki, garnir va rozmarin sousi bilan',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap["Mol go'shti (Lahm)"],
    },
    {
      name: 'Qo\'y go\'shti shashlik',
      categoryId: categoryMap['Taomlar'],
      price: 32000,
      description: 'Dumbasi bilan marinadlangan lazzatli tandir shashlik',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap["Mol go'shti (Lahm)"],
    },
    {
      name: 'Tovuq qanotchalari BBQ',
      categoryId: categoryMap['Taomlar'],
      price: 55000,
      description: 'Qarsildoq achchiq-shirin BBQ sousidagi tovuq qanotchalari',
      imageUrl: 'https://images.unsplash.com/photo-1527477378370-562725350c76?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Tovuq filesi'],
    },
    {
      name: 'Qozon kabob Vegas',
      categoryId: categoryMap['Taomlar'],
      price: 85000,
      description: 'Qovurilgan qizil go\'sht va tillarang kartoshkalar',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap["Mol go'shti (Lahm)"],
    },
    // Salatlar
    {
      name: 'Sezar salati tovuq bilan',
      categoryId: categoryMap['Salatlar'],
      price: 48000,
      description: 'Aysberg barglari, tovuq filesi, parmezan pishlog\'i va maxsus Sezar sousi',
      imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Tovuq filesi'],
    },
    {
      name: 'Grek salati',
      categoryId: categoryMap['Salatlar'],
      price: 42000,
      description: 'Yangi bodring, pomidor, qora zaytun va Feta pishlog\'i',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Pomidor'],
    },
    {
      name: 'Achchiq-chuchuk',
      categoryId: categoryMap['Salatlar'],
      price: 24000,
      description: 'Yupqa to\'g\'ralgan shirali pomidor, piyoz va rayhon',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Pomidor'],
    },
    {
      name: 'Iliq mol go\'shtli salat',
      categoryId: categoryMap['Salatlar'],
      price: 52000,
      description: 'Qovurilgan mol go\'shti bo\'laklari, miks salat va kunjutli sous',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap["Mol go'shti (Lahm)"],
    },
    // Fast Food
    {
      name: 'Vegas Max Burger',
      categoryId: categoryMap['Fast Food'],
      price: 48000,
      description: 'Suvli mol go\'shti kotleti, erigan pishloq, tuzlangan bodring va fri bilan',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap['Burger bulochkasi'],
    },
    {
      name: 'Double Cheeseburger',
      categoryId: categoryMap['Fast Food'],
      price: 56000,
      description: 'Ikkita mol go\'shti kotleti, ikki qavat cheddr pishlog\'i',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap['Burger bulochkasi'],
    },
    {
      name: 'Lavash Vegas Mol Go\'shtli',
      categoryId: categoryMap['Fast Food'],
      price: 38000,
      description: 'Yupqa xamirda tender go\'sht, pomidor, chips va sarimsoqli sous',
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap['Lavash xamiri'],
    },
    {
      name: 'Fri kartoshkasi (Fries)',
      categoryId: categoryMap['Fast Food'],
      price: 22000,
      description: 'Tillarang qarsildoq kartoshka fri, ketchup va mayonez bilan',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Kartoshka'],
    },
    {
      name: 'Pizza Pepperoni 32cm',
      categoryId: categoryMap['Fast Food'],
      price: 78000,
      description: 'Achchiq kolbasa, pomidor sousi va ko\'p miqdorda mozzarella pishlog\'i',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap['Pishloq Mozzarella'],
    },
    // Ichimliklar
    {
      name: 'Coca-Cola 0.5L',
      categoryId: categoryMap['Ichimliklar'],
      price: 12000,
      description: 'Muzdek tetiklantiruvchi gazlangan ichimlik',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
      unit: 'dona',
      inventoryId: inventoryMap['Coca-Cola 0.5L'],
    },
    {
      name: 'Yalpizli Limonad 1L',
      categoryId: categoryMap['Ichimliklar'],
      price: 28000,
      description: 'Yangi limon, laym va yalpiz barglaridan tabiiy uy limonadi',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      unit: 'grafin',
      inventoryId: null,
    },
    {
      name: 'Ko\'k choy limon va asal bilan',
      categoryId: categoryMap['Ichimliklar'],
      price: 16000,
      description: 'Xushbo\'y ko\'k choy, yangi limon bo\'laklari bilan',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      unit: 'choynak',
      inventoryId: null,
    },
    // Qahva
    {
      name: 'Americano',
      categoryId: categoryMap['Qahva'],
      price: 20000,
      description: 'Klassik quyuq espresso va issiq suv aralashmasi',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      unit: 'stakan',
      inventoryId: inventoryMap['Qahva donalari (Arabica)'],
    },
    {
      name: 'Cappuccino',
      categoryId: categoryMap['Qahva'],
      price: 26000,
      description: 'Espresso va nozik sut ko\'pigi bilan uyg\'unlik',
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
      unit: 'stakan',
      inventoryId: inventoryMap['Sut 3.2%'],
    },
    {
      name: 'Latte Caramel',
      categoryId: categoryMap['Qahva'],
      price: 29000,
      description: 'Yumshoq sutli qahva va karamel siropi',
      imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
      unit: 'stakan',
      inventoryId: inventoryMap['Sut 3.2%'],
    },
    // Shirinliklar
    {
      name: 'San Sebastian Cheesecake',
      categoryId: categoryMap['Shirinliklar'],
      price: 42000,
      description: 'Kuygan krem pishloqli nozik ispan chizkeyki, issiq shokolad sousi bilan',
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: inventoryMap['Qaymoq 33%'],
    },
    {
      name: 'Tiramisu Vegas',
      categoryId: categoryMap['Shirinliklar'],
      price: 38000,
      description: 'Maskarpone kremi va qahvali Savoiardi pechenyelari bilan haqiqiy italyancha desert',
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: null,
    },
    {
      name: 'Shokoladli Fondan',
      categoryId: categoryMap['Shirinliklar'],
      price: 36000,
      description: 'Ichidan oquvchi issiq belgiya shokoladi va vanilli muzqaymoq',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      unit: 'porsiya',
      inventoryId: null,
    },
  ];

  const productMap: Record<string, any> = {};
  for (const prod of productsData) {
    const created = await prisma.product.create({ data: prod });
    productMap[prod.name] = created;
  }
  console.log('22 products created successfully.');

  // 6. Tables (10 tables across Zal, Terassa, VIP)
  const tablesData = [
    { number: 1, capacity: 4, section: 'Zal', status: 'EMPTY' },
    { number: 2, capacity: 4, section: 'Zal', status: 'OCCUPIED' },
    { number: 3, capacity: 2, section: 'Zal', status: 'EMPTY' },
    { number: 4, capacity: 6, section: 'Zal', status: 'EMPTY' },
    { number: 5, capacity: 4, section: 'Zal', status: 'EMPTY' },
    { number: 6, capacity: 8, section: 'Zal', status: 'EMPTY' },
    { number: 7, capacity: 8, section: 'VIP', status: 'RESERVED' },
    { number: 8, capacity: 10, section: 'VIP', status: 'EMPTY' },
    { number: 9, capacity: 4, section: 'Terassa', status: 'EMPTY' },
    { number: 10, capacity: 4, section: 'Terassa', status: 'EMPTY' },
  ];

  const tableMap: Record<number, any> = {};
  for (const t of tablesData) {
    const created = await prisma.table.create({ data: t });
    tableMap[t.number] = created;
  }
  console.log('10 tables created successfully.');

  // 7. Customers (10 demo customers)
  const customersData = [
    { fullName: 'Bobur Mansurov', phone: '+998 90 111 22 33', visitsCount: 8, totalSpent: 1850000, notes: 'Doimiy VIP mijoz, 7-stol VIP ni yoqtiradi' },
    { fullName: 'Nilufar Usmonova', phone: '+998 93 222 33 44', visitsCount: 4, totalSpent: 720000, notes: 'Desertlarni xush ko\'radi' },
    { fullName: 'Sherzod Qodirov', phone: '+998 97 333 44 55', visitsCount: 6, totalSpent: 1240000, notes: 'Doim steyk buyurtma qiladi' },
    { fullName: 'Gulnoza Ahmedova', phone: '+998 91 444 55 66', visitsCount: 3, totalSpent: 450000, notes: 'Terassa qismida o\'tiradi' },
    { fullName: 'Jamshid Ergashev', phone: '+998 94 555 66 77', visitsCount: 5, totalSpent: 980000, notes: 'Biznes tushlik mijoz' },
    { fullName: 'Madina Saidova', phone: '+998 99 666 77 88', visitsCount: 2, totalSpent: 310000, notes: 'Qahva ixlosmandi' },
    { fullName: 'Ulug\'bek Jo\'rayev', phone: '+998 90 777 88 99', visitsCount: 7, totalSpent: 1600000, notes: 'Katta oilaviy tashriflar' },
    { fullName: 'Feruza Toirova', phone: '+998 93 888 99 00', visitsCount: 3, totalSpent: 520000, notes: 'Sezar va limonad' },
    { fullName: 'Otabek Shukurov', phone: '+998 97 999 00 11', visitsCount: 4, totalSpent: 890000, notes: 'Fast food va pitsa' },
    { fullName: 'Rayhona Karimova', phone: '+998 91 000 11 22', visitsCount: 1, totalSpent: 180000, notes: 'Yangi mijoz' },
  ];

  const customerList: any[] = [];
  for (const c of customersData) {
    const created = await prisma.customer.create({ data: c });
    customerList.push(created);
  }

  // 8. Reservation for Table 7 (VIP 1)
  const today = new Date().toISOString().split('T')[0];
  await prisma.reservation.create({
    data: {
      customerName: 'Bobur Mansurov',
      customerPhone: '+998 90 111 22 33',
      customerId: customerList[0].id,
      tableId: tableMap[7].id,
      guestsCount: 6,
      reservationDate: today,
      reservationTime: '19:30',
      status: 'CONFIRMED',
      notes: 'Tug\'ilgan kun kechasi, maxsus dasturxon',
    },
  });

  // 9. Active Order on Table 2 (Band stol) for live test
  const activeOrder = await prisma.order.create({
    data: {
      orderNumber: 'VGS-1001',
      tableId: tableMap[2].id,
      waiterId: waiter1.id,
      customerId: customerList[1].id,
      status: 'PREPARING',
      subtotal: 195000,
      discount: 0,
      serviceFee: 19500,
      finalAmount: 214500,
      notes: 'Steyk o\'rtacha qovurilsin (Medium Well)',
      items: {
        create: [
          {
            productId: productMap['Vegas Ribeye Steyk'].id,
            quantity: 1,
            unitPrice: 135000,
            totalPrice: 135000,
            comment: 'Medium well',
          },
          {
            productId: productMap['Sezar salati tovuq bilan'].id,
            quantity: 1,
            unitPrice: 48000,
            totalPrice: 48000,
          },
          {
            productId: productMap['Coca-Cola 0.5L'].id,
            quantity: 1,
            unitPrice: 12000,
            totalPrice: 12000,
            comment: 'Muz bilan',
          },
        ],
      },
    },
  });

  // 10. Historical Paid Orders for Charts and Analytics (Past 7 days)
  const pastOrders = [
    {
      orderNumber: 'VGS-0995',
      tableId: tableMap[1].id,
      waiterId: waiter1.id,
      customerId: customerList[2].id,
      status: 'PAID',
      subtotal: 240000,
      discount: 10000,
      serviceFee: 23000,
      finalAmount: 253000,
      daysAgo: 0,
      paymentMethod: 'CARD',
      items: [
        { prod: 'Vegas Ribeye Steyk', qty: 1, price: 135000 },
        { prod: 'Pizza Pepperoni 32cm', qty: 1, price: 78000 },
        { prod: 'Americano', qty: 1, price: 20000 },
      ],
    },
    {
      orderNumber: 'VGS-0996',
      tableId: tableMap[3].id,
      waiterId: waiter2.id,
      customerId: customerList[3].id,
      status: 'PAID',
      subtotal: 126000,
      discount: 0,
      serviceFee: 12600,
      finalAmount: 138600,
      daysAgo: 0,
      paymentMethod: 'CASH',
      items: [
        { prod: 'Vegas Max Burger', qty: 2, price: 48000 },
        { prod: 'Coca-Cola 0.5L', qty: 2, price: 12000 },
      ],
    },
    {
      orderNumber: 'VGS-0990',
      tableId: tableMap[4].id,
      waiterId: waiter1.id,
      customerId: customerList[4].id,
      status: 'PAID',
      subtotal: 310000,
      discount: 20000,
      serviceFee: 29000,
      finalAmount: 319000,
      daysAgo: 1,
      paymentMethod: 'CARD',
      items: [
        { prod: 'Qozon kabob Vegas', qty: 2, price: 85000 },
        { prod: 'Sezar salati tovuq bilan', qty: 2, price: 48000 },
        { prod: 'San Sebastian Cheesecake', qty: 1, price: 42000 },
      ],
    },
    {
      orderNumber: 'VGS-0985',
      tableId: tableMap[5].id,
      waiterId: waiter2.id,
      customerId: customerList[5].id,
      status: 'PAID',
      subtotal: 180000,
      discount: 0,
      serviceFee: 18000,
      finalAmount: 198000,
      daysAgo: 2,
      paymentMethod: 'CASH',
      items: [
        { prod: 'Pizza Pepperoni 32cm', qty: 1, price: 78000 },
        { prod: 'Double Cheeseburger', qty: 1, price: 56000 },
        { prod: 'Fri kartoshkasi (Fries)', qty: 2, price: 22000 },
      ],
    },
    {
      orderNumber: 'VGS-0980',
      tableId: tableMap[6].id,
      waiterId: waiter1.id,
      customerId: customerList[6].id,
      status: 'PAID',
      subtotal: 450000,
      discount: 25000,
      serviceFee: 42500,
      finalAmount: 467500,
      daysAgo: 3,
      paymentMethod: 'CARD',
      items: [
        { prod: 'Vegas Ribeye Steyk', qty: 2, price: 135000 },
        { prod: 'Qo\'y go\'shti shashlik', qty: 3, price: 32000 },
        { prod: 'Yalpizli Limonad 1L', qty: 2, price: 28000 },
      ],
    },
    {
      orderNumber: 'VGS-0975',
      tableId: tableMap[1].id,
      waiterId: waiter2.id,
      customerId: customerList[7].id,
      status: 'PAID',
      subtotal: 210000,
      discount: 0,
      serviceFee: 21000,
      finalAmount: 231000,
      daysAgo: 4,
      paymentMethod: 'CASH',
      items: [
        { prod: 'Sezar salati tovuq bilan', qty: 2, price: 48000 },
        { prod: 'Tiramisu Vegas', qty: 2, price: 38000 },
        { prod: 'Cappuccino', qty: 2, price: 26000 },
      ],
    },
  ];

  for (const hist of pastOrders) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - hist.daysAgo);

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: hist.orderNumber,
        tableId: hist.tableId,
        waiterId: hist.waiterId,
        customerId: hist.customerId,
        status: hist.status,
        subtotal: hist.subtotal,
        discount: hist.discount,
        serviceFee: hist.serviceFee,
        finalAmount: hist.finalAmount,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: hist.items.map((it) => ({
            productId: productMap[it.prod].id,
            quantity: it.qty,
            unitPrice: it.price,
            totalPrice: it.qty * it.price,
          })),
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: createdOrder.id,
        cashierId: cashier.id,
        amount: hist.finalAmount,
        paymentMethod: hist.paymentMethod,
        cashReceived: hist.paymentMethod === 'CASH' ? hist.finalAmount + 10000 : hist.finalAmount,
        changeGiven: hist.paymentMethod === 'CASH' ? 10000 : 0,
        paidAt: orderDate,
      },
    });
  }
  console.log('Historical orders and payments created.');

  // 11. Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Ombor ogohlantirishi!',
        message: '"Pomidor" qoldig\'i minimal me\'yordan kam qoldi (4.2 kg qoldi, min: 6 kg)',
        type: 'LOW_STOCK',
        isRead: false,
      },
      {
        title: 'Ombor ogohlantirishi!',
        message: '"Burger bulochkasi" qoldig\'i kam qoldi (12 dona qoldi, min: 15 dona)',
        type: 'LOW_STOCK',
        isRead: false,
      },
      {
        title: 'Yangi buyurtma',
        message: '2-stol uchun yangi VGS-1001 buyurtmasi qabul qilindi',
        type: 'NEW_ORDER',
        isRead: false,
      },
      {
        title: 'VIP Rezervatsiya',
        message: 'Bobur Mansurov tomonidan VIP 7-stol bugun 19:30 ga band qilindi',
        type: 'RESERVATION',
        isRead: false,
      },
      {
        title: 'To\'lov qabul qilindi',
        message: 'VGS-0995 buyurtmasi bo\'yicha 253 000 so\'m karta orqali to\'landi',
        type: 'PAYMENT',
        isRead: true,
      },
    ],
  });

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: admin.id,
        details: 'Bosh administrator tizimga kirdi',
        ipAddress: '127.0.0.1',
      },
      {
        userId: waiter1.id,
        action: 'CREATE_ORDER',
        entity: 'Order',
        entityId: activeOrder.id,
        details: '2-stol uchun VGS-1001 buyurtmasi yaratildi',
        ipAddress: '127.0.0.1',
      },
      {
        userId: cashier.id,
        action: 'PAYMENT_RECEIVED',
        entity: 'Payment',
        details: 'VGS-0995 buyurtma uchun to\'lov qabul qilindi',
        ipAddress: '127.0.0.1',
      },
      {
        userId: stockKeeper.id,
        action: 'INVENTORY_ENTRY',
        entity: 'Inventory',
        details: 'Boshlang\'ich ombor zaxiralari tasdiqlandi',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('Seed completed successfully! All 14 tables populated.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
