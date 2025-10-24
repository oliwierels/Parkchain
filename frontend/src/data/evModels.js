// Electric Vehicle Models Database
// Comprehensive list of popular EV models with battery specifications

export const EV_MODELS = [
  // Tesla
  {
    id: 'tesla-model-3-sr',
    brand: 'Tesla',
    model: 'Model 3 Standard Range',
    fullName: 'Tesla Model 3 Standard Range',
    batteryCapacity: 60, // kWh
    range: 491, // km WLTP
    maxChargingPower: 170, // kW
    category: 'sedan'
  },
  {
    id: 'tesla-model-3-lr',
    brand: 'Tesla',
    model: 'Model 3 Long Range',
    fullName: 'Tesla Model 3 Long Range',
    batteryCapacity: 82,
    range: 629,
    maxChargingPower: 250,
    category: 'sedan'
  },
  {
    id: 'tesla-model-3-p',
    brand: 'Tesla',
    model: 'Model 3 Performance',
    fullName: 'Tesla Model 3 Performance',
    batteryCapacity: 82,
    range: 567,
    maxChargingPower: 250,
    category: 'sedan'
  },
  {
    id: 'tesla-model-y-lr',
    brand: 'Tesla',
    model: 'Model Y Long Range',
    fullName: 'Tesla Model Y Long Range',
    batteryCapacity: 81,
    range: 533,
    maxChargingPower: 250,
    category: 'suv'
  },
  {
    id: 'tesla-model-y-p',
    brand: 'Tesla',
    model: 'Model Y Performance',
    fullName: 'Tesla Model Y Performance',
    batteryCapacity: 81,
    range: 514,
    maxChargingPower: 250,
    category: 'suv'
  },
  {
    id: 'tesla-model-s',
    brand: 'Tesla',
    model: 'Model S',
    fullName: 'Tesla Model S',
    batteryCapacity: 100,
    range: 634,
    maxChargingPower: 250,
    category: 'sedan'
  },
  {
    id: 'tesla-model-x',
    brand: 'Tesla',
    model: 'Model X',
    fullName: 'Tesla Model X',
    batteryCapacity: 100,
    range: 560,
    maxChargingPower: 250,
    category: 'suv'
  },

  // Volkswagen
  {
    id: 'vw-id3-pro',
    brand: 'Volkswagen',
    model: 'ID.3 Pro',
    fullName: 'Volkswagen ID.3 Pro',
    batteryCapacity: 58,
    range: 426,
    maxChargingPower: 100,
    category: 'hatchback'
  },
  {
    id: 'vw-id3-pro-s',
    brand: 'Volkswagen',
    model: 'ID.3 Pro S',
    fullName: 'Volkswagen ID.3 Pro S',
    batteryCapacity: 77,
    range: 557,
    maxChargingPower: 125,
    category: 'hatchback'
  },
  {
    id: 'vw-id4-pro',
    brand: 'Volkswagen',
    model: 'ID.4 Pro',
    fullName: 'Volkswagen ID.4 Pro',
    batteryCapacity: 77,
    range: 520,
    maxChargingPower: 125,
    category: 'suv'
  },
  {
    id: 'vw-id4-gtx',
    brand: 'Volkswagen',
    model: 'ID.4 GTX',
    fullName: 'Volkswagen ID.4 GTX',
    batteryCapacity: 77,
    range: 480,
    maxChargingPower: 125,
    category: 'suv'
  },
  {
    id: 'vw-id5',
    brand: 'Volkswagen',
    model: 'ID.5',
    fullName: 'Volkswagen ID.5',
    batteryCapacity: 77,
    range: 520,
    maxChargingPower: 135,
    category: 'suv'
  },
  {
    id: 'vw-id-buzz',
    brand: 'Volkswagen',
    model: 'ID. Buzz',
    fullName: 'Volkswagen ID. Buzz',
    batteryCapacity: 77,
    range: 423,
    maxChargingPower: 170,
    category: 'van'
  },

  // Nissan
  {
    id: 'nissan-leaf-40',
    brand: 'Nissan',
    model: 'Leaf 40 kWh',
    fullName: 'Nissan Leaf 40 kWh',
    batteryCapacity: 40,
    range: 270,
    maxChargingPower: 50,
    category: 'hatchback'
  },
  {
    id: 'nissan-leaf-62',
    brand: 'Nissan',
    model: 'Leaf e+ 62 kWh',
    fullName: 'Nissan Leaf e+ 62 kWh',
    batteryCapacity: 62,
    range: 385,
    maxChargingPower: 100,
    category: 'hatchback'
  },
  {
    id: 'nissan-ariya',
    brand: 'Nissan',
    model: 'Ariya 63 kWh',
    fullName: 'Nissan Ariya 63 kWh',
    batteryCapacity: 63,
    range: 403,
    maxChargingPower: 130,
    category: 'suv'
  },
  {
    id: 'nissan-ariya-87',
    brand: 'Nissan',
    model: 'Ariya 87 kWh',
    fullName: 'Nissan Ariya 87 kWh',
    batteryCapacity: 87,
    range: 520,
    maxChargingPower: 130,
    category: 'suv'
  },

  // Hyundai
  {
    id: 'hyundai-ioniq5-58',
    brand: 'Hyundai',
    model: 'IONIQ 5 58 kWh',
    fullName: 'Hyundai IONIQ 5 58 kWh',
    batteryCapacity: 58,
    range: 384,
    maxChargingPower: 220,
    category: 'suv'
  },
  {
    id: 'hyundai-ioniq5-77',
    brand: 'Hyundai',
    model: 'IONIQ 5 77.4 kWh',
    fullName: 'Hyundai IONIQ 5 77.4 kWh',
    batteryCapacity: 77.4,
    range: 507,
    maxChargingPower: 220,
    category: 'suv'
  },
  {
    id: 'hyundai-ioniq6',
    brand: 'Hyundai',
    model: 'IONIQ 6',
    fullName: 'Hyundai IONIQ 6',
    batteryCapacity: 77.4,
    range: 614,
    maxChargingPower: 220,
    category: 'sedan'
  },
  {
    id: 'hyundai-kona',
    brand: 'Hyundai',
    model: 'Kona Electric',
    fullName: 'Hyundai Kona Electric',
    batteryCapacity: 64,
    range: 484,
    maxChargingPower: 77,
    category: 'suv'
  },

  // Kia
  {
    id: 'kia-ev6-58',
    brand: 'Kia',
    model: 'EV6 58 kWh',
    fullName: 'Kia EV6 58 kWh',
    batteryCapacity: 58,
    range: 394,
    maxChargingPower: 220,
    category: 'suv'
  },
  {
    id: 'kia-ev6-77',
    brand: 'Kia',
    model: 'EV6 77.4 kWh',
    fullName: 'Kia EV6 77.4 kWh',
    batteryCapacity: 77.4,
    range: 528,
    maxChargingPower: 220,
    category: 'suv'
  },
  {
    id: 'kia-niro-ev',
    brand: 'Kia',
    model: 'Niro EV',
    fullName: 'Kia Niro EV',
    batteryCapacity: 64.8,
    range: 463,
    maxChargingPower: 85,
    category: 'suv'
  },
  {
    id: 'kia-ev9',
    brand: 'Kia',
    model: 'EV9',
    fullName: 'Kia EV9',
    batteryCapacity: 99.8,
    range: 541,
    maxChargingPower: 210,
    category: 'suv'
  },

  // BMW
  {
    id: 'bmw-i3',
    brand: 'BMW',
    model: 'i3',
    fullName: 'BMW i3',
    batteryCapacity: 42.2,
    range: 310,
    maxChargingPower: 50,
    category: 'hatchback'
  },
  {
    id: 'bmw-i4',
    brand: 'BMW',
    model: 'i4 eDrive40',
    fullName: 'BMW i4 eDrive40',
    batteryCapacity: 83.9,
    range: 590,
    maxChargingPower: 200,
    category: 'sedan'
  },
  {
    id: 'bmw-ix3',
    brand: 'BMW',
    model: 'iX3',
    fullName: 'BMW iX3',
    batteryCapacity: 80,
    range: 461,
    maxChargingPower: 150,
    category: 'suv'
  },
  {
    id: 'bmw-ix',
    brand: 'BMW',
    model: 'iX xDrive40',
    fullName: 'BMW iX xDrive40',
    batteryCapacity: 76.6,
    range: 425,
    maxChargingPower: 150,
    category: 'suv'
  },
  {
    id: 'bmw-ix-50',
    brand: 'BMW',
    model: 'iX xDrive50',
    fullName: 'BMW iX xDrive50',
    batteryCapacity: 111.5,
    range: 630,
    maxChargingPower: 200,
    category: 'suv'
  },

  // Mercedes
  {
    id: 'mercedes-eqa',
    brand: 'Mercedes-Benz',
    model: 'EQA',
    fullName: 'Mercedes-Benz EQA',
    batteryCapacity: 66.5,
    range: 426,
    maxChargingPower: 100,
    category: 'suv'
  },
  {
    id: 'mercedes-eqb',
    brand: 'Mercedes-Benz',
    model: 'EQB',
    fullName: 'Mercedes-Benz EQB',
    batteryCapacity: 66.5,
    range: 423,
    maxChargingPower: 100,
    category: 'suv'
  },
  {
    id: 'mercedes-eqc',
    brand: 'Mercedes-Benz',
    model: 'EQC',
    fullName: 'Mercedes-Benz EQC',
    batteryCapacity: 80,
    range: 437,
    maxChargingPower: 110,
    category: 'suv'
  },
  {
    id: 'mercedes-eqe',
    brand: 'Mercedes-Benz',
    model: 'EQE',
    fullName: 'Mercedes-Benz EQE',
    batteryCapacity: 90.6,
    range: 639,
    maxChargingPower: 170,
    category: 'sedan'
  },
  {
    id: 'mercedes-eqs',
    brand: 'Mercedes-Benz',
    model: 'EQS',
    fullName: 'Mercedes-Benz EQS',
    batteryCapacity: 107.8,
    range: 782,
    maxChargingPower: 200,
    category: 'sedan'
  },

  // Audi
  {
    id: 'audi-e-tron',
    brand: 'Audi',
    model: 'e-tron',
    fullName: 'Audi e-tron',
    batteryCapacity: 95,
    range: 436,
    maxChargingPower: 150,
    category: 'suv'
  },
  {
    id: 'audi-e-tron-gt',
    brand: 'Audi',
    model: 'e-tron GT',
    fullName: 'Audi e-tron GT',
    batteryCapacity: 93.4,
    range: 488,
    maxChargingPower: 270,
    category: 'sedan'
  },
  {
    id: 'audi-q4-etron',
    brand: 'Audi',
    model: 'Q4 e-tron',
    fullName: 'Audi Q4 e-tron',
    batteryCapacity: 82,
    range: 534,
    maxChargingPower: 135,
    category: 'suv'
  },

  // Polestar
  {
    id: 'polestar-2-sr',
    brand: 'Polestar',
    model: 'Polestar 2 SR',
    fullName: 'Polestar 2 Standard Range',
    batteryCapacity: 64,
    range: 440,
    maxChargingPower: 130,
    category: 'sedan'
  },
  {
    id: 'polestar-2-lr',
    brand: 'Polestar',
    model: 'Polestar 2 LR',
    fullName: 'Polestar 2 Long Range',
    batteryCapacity: 78,
    range: 542,
    maxChargingPower: 155,
    category: 'sedan'
  },

  // Renault
  {
    id: 'renault-zoe',
    brand: 'Renault',
    model: 'ZOE',
    fullName: 'Renault ZOE',
    batteryCapacity: 52,
    range: 395,
    maxChargingPower: 50,
    category: 'hatchback'
  },
  {
    id: 'renault-megane-e-tech',
    brand: 'Renault',
    model: 'Megane E-Tech',
    fullName: 'Renault Megane E-Tech',
    batteryCapacity: 60,
    range: 450,
    maxChargingPower: 130,
    category: 'suv'
  },

  // Škoda
  {
    id: 'skoda-enyaq-60',
    brand: 'Škoda',
    model: 'Enyaq iV 60',
    fullName: 'Škoda Enyaq iV 60',
    batteryCapacity: 62,
    range: 412,
    maxChargingPower: 120,
    category: 'suv'
  },
  {
    id: 'skoda-enyaq-80',
    brand: 'Škoda',
    model: 'Enyaq iV 80',
    fullName: 'Škoda Enyaq iV 80',
    batteryCapacity: 82,
    range: 534,
    maxChargingPower: 135,
    category: 'suv'
  },

  // Ford
  {
    id: 'ford-mustang-mach-e-sr',
    brand: 'Ford',
    model: 'Mustang Mach-E SR',
    fullName: 'Ford Mustang Mach-E Standard Range',
    batteryCapacity: 68,
    range: 440,
    maxChargingPower: 150,
    category: 'suv'
  },
  {
    id: 'ford-mustang-mach-e-er',
    brand: 'Ford',
    model: 'Mustang Mach-E ER',
    fullName: 'Ford Mustang Mach-E Extended Range',
    batteryCapacity: 91,
    range: 600,
    maxChargingPower: 150,
    category: 'suv'
  },

  // MG
  {
    id: 'mg-zs-ev',
    brand: 'MG',
    model: 'ZS EV',
    fullName: 'MG ZS EV',
    batteryCapacity: 72.6,
    range: 440,
    maxChargingPower: 92,
    category: 'suv'
  },
  {
    id: 'mg-4',
    brand: 'MG',
    model: 'MG4 Electric',
    fullName: 'MG MG4 Electric',
    batteryCapacity: 64,
    range: 450,
    maxChargingPower: 135,
    category: 'hatchback'
  },

  // Porsche
  {
    id: 'porsche-taycan',
    brand: 'Porsche',
    model: 'Taycan',
    fullName: 'Porsche Taycan',
    batteryCapacity: 79.2,
    range: 431,
    maxChargingPower: 270,
    category: 'sedan'
  },
  {
    id: 'porsche-taycan-plus',
    brand: 'Porsche',
    model: 'Taycan (Plus)',
    fullName: 'Porsche Taycan Performance Battery Plus',
    batteryCapacity: 93.4,
    range: 504,
    maxChargingPower: 270,
    category: 'sedan'
  },

  // Fiat
  {
    id: 'fiat-500e',
    brand: 'Fiat',
    model: '500e',
    fullName: 'Fiat 500e',
    batteryCapacity: 42,
    range: 320,
    maxChargingPower: 85,
    category: 'hatchback'
  },

  // Opel/Vauxhall
  {
    id: 'opel-corsa-e',
    brand: 'Opel',
    model: 'Corsa-e',
    fullName: 'Opel Corsa-e',
    batteryCapacity: 50,
    range: 357,
    maxChargingPower: 100,
    category: 'hatchback'
  },
  {
    id: 'opel-mokka-e',
    brand: 'Opel',
    model: 'Mokka-e',
    fullName: 'Opel Mokka-e',
    batteryCapacity: 50,
    range: 338,
    maxChargingPower: 100,
    category: 'suv'
  },

  // Peugeot
  {
    id: 'peugeot-e-208',
    brand: 'Peugeot',
    model: 'e-208',
    fullName: 'Peugeot e-208',
    batteryCapacity: 50,
    range: 362,
    maxChargingPower: 100,
    category: 'hatchback'
  },
  {
    id: 'peugeot-e-2008',
    brand: 'Peugeot',
    model: 'e-2008',
    fullName: 'Peugeot e-2008',
    batteryCapacity: 50,
    range: 345,
    maxChargingPower: 100,
    category: 'suv'
  },
];

// Helper functions
export const getBrandsList = () => {
  const brands = [...new Set(EV_MODELS.map(ev => ev.brand))];
  return brands.sort();
};

export const getModelsByBrand = (brand) => {
  return EV_MODELS.filter(ev => ev.brand === brand);
};

export const getModelById = (id) => {
  return EV_MODELS.find(ev => ev.id === id);
};

export const searchModels = (query) => {
  const lowerQuery = query.toLowerCase();
  return EV_MODELS.filter(ev =>
    ev.fullName.toLowerCase().includes(lowerQuery) ||
    ev.brand.toLowerCase().includes(lowerQuery) ||
    ev.model.toLowerCase().includes(lowerQuery)
  );
};

export const getModelsByCategory = (category) => {
  return EV_MODELS.filter(ev => ev.category === category);
};

export const calculateChargingTime = (batteryCapacity, currentCharge, targetCharge, chargingPower) => {
  const chargeNeeded = (targetCharge - currentCharge) / 100 * batteryCapacity;
  const timeInHours = chargeNeeded / chargingPower;
  return {
    hours: Math.floor(timeInHours),
    minutes: Math.round((timeInHours % 1) * 60),
    kWhNeeded: chargeNeeded.toFixed(2)
  };
};

export default EV_MODELS;
